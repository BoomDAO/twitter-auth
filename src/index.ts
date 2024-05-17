import { config } from 'dotenv';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import axios from 'axios';
import needle from 'needle';
import cors from 'cors';
import { Client, GatewayIntentBits, PermissionResolvable } from 'discord.js';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v9';

config();

const corsOptions = {
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}

const port = process.env.PORT || 3000;

async function getUserTwitterData(username: string) {
  const token = process.env.BEARER_TOKEN;
  const endpointURL = "https://api.twitter.com/2/users/by?usernames="
  const params = {
    usernames: username,
    "user.fields": "created_at,name,connection_status,public_metrics"
  }
  const res = await needle('get', endpointURL, params, {
    headers: {
      "User-Agent": "v2UserLookupJS",
      "authorization": `Bearer ${token}`
    }
  })
  if (res.body) {
    // console.dir(res, {
    //   depth: null
    // });
    return res.body;
  } else {
    throw new Error('Unsuccessful request')
  }
}

const getUserLatestTweetData = async (userId: string) => {
  const url = `https://api.twitter.com/2/users/${userId}/tweets`;
  const token = process.env.BEARER_TOKEN;
  let params = {
    "tweet.fields": "created_at",
    "expansions": "author_id"
  }
  const options = {
    headers: {
      "User-Agent": "v2UserTweetsJS",
      "authorization": `Bearer ${token}`
    }
  }
  const resp = await needle('get', url, params, options);
  return resp.body.data[0].text;
}

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj: Express.User, done) {
  done(null, obj);
});

const app = express();

app.use(cors(corsOptions))
app.use(passport.initialize());
app.use(
  session({ secret: 'keyboard cat', resave: false, saveUninitialized: true })
);

app.get('/', async function (req, res) {
  passport.use(
    new Strategy(
      {
        clientID: process.env.TWITTER_CLIENT_ID as string,
        clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
        clientType: 'confidential',
        callbackURL: `https://boom-dao-twitter-auth.up.railway.app/authorized?userId=${req.query.userId}`,
      },
      (accessToken: string, refreshToken: string, profile: any, done: any) => {
        return done(null, profile);
      }
    )
  );
  res.redirect("https://boom-dao-twitter-auth.up.railway.app/x/authentication");
});

app.get(
  '/x/authentication',
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
  })
);

app.get(
  '/authorized',
  passport.authenticate('twitter'),
  async function (req, res) {
    const userData = JSON.stringify(req.user, undefined, 2);
    const data = JSON.parse(userData);
    let uid = req.query.userId;
    const response = await axios.post(process.env.UPDATE_URL ? process.env.UPDATE_URL : "", {}, {
      headers: {
        'key': process.env.KEY,
        'tid': data.id,
        'uid': String(uid),
        'tusername': String(data.username)
      }
    })
    if (response.status == 200) {
      res.end(
        `<h1>You have successfully linked your Twitter account to BOOM Gaming Guild account. <br></br>Click <a href="https://n7z64-2yaaa-aaaam-abnsa-cai.icp0.io/">BOOM Gaming Guild</a> to get redirected to BGG website and complete your Twitter Quests now.</h1>`
      );
    } else {
      res.end(
        `<h1>${response.data}</h1>`
      );
    }
  }
);

app.post('/check-twitter-quest-status', async function (req, res) {
  let auth = req.headers['Authorization'];
  if (auth != process.env.key) {
    res.status(404).end();
  }
  let tusername = req.headers['tusername'];
  let tuserid = req.headers['tuserid'];
  let principal = req.headers['principalid'];
  let actionId = req.headers['actionid'];

  try {
    let user_data = await getUserTwitterData(String(tusername));
    let tweet_data = await getUserLatestTweetData(String(tuserid));
    let followers_count = user_data.data[0].public_metrics.followers_count;
    // Handle Tweet Checks
    if (followers_count >= 10 && String(tweet_data).includes("#BOOMDAO")) {
      const response = await axios.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
        headers: {
          'key': process.env.KEY,
          'aid': actionId,
          'uid': principal,
        }
      })
      if (response.status == 200) {
        res.status(200).send({ msg: 'Your twitter post has been verified and quest rewards have been processed.' })
        res.status(200).end();
      } else {
        res.status(401).send({ msg: 'Your tweet has been verified but some error occured in server, report this incident to dev team in discord' });
        res.status(401).end();
      }
    } else {
      const response = await axios.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
        headers: {
          'key': process.env.KEY,
          'aid': "remove_entity_" + actionId,
          'uid': principal,
        }
      })
      if (response.status == 200) {
        res.status(202).send({ msg: 'We could not verify the tweet which your were supposed to do in order to complete this Quest, contact dev team for support.' })
        res.status(202).end();
      } else {
        res.status(402).send({ msg: 'We could not verify the tweet as some error occured in server, report this incident to dev team in discord' });
        res.status(402).end();
      }
    }
  } catch (e) {
    res.send({ msg: e });
    res.status(404).end();
  }
})

app.post('/grant-twitter-quest-entity', async function (req, res) {
  let auth = req.headers['Authorization'];
  if (auth != process.env.key) {
    res.status(404).end();
  }
  let principal = req.headers['uid'];
  try {
    const response = await axios.post(process.env.GRANT_TWITTER_QUEST_ENTITY_URL ? process.env.GRANT_TWITTER_QUEST_ENTITY_URL : "", {}, {
      headers: {
        'key': process.env.KEY,
        'uid': principal,
      }
    })
    res.end();
  } catch (e) {
    res.send({ msg: e });
    res.status(404).end();
  }
})

app.post('/set-user-discord-details', async function (req, res) {
  let auth = req.headers['Authorization'];
  if (auth != process.env.key) {
    res.status(404).end();
  }
  let principal = req.headers['uid'];
  let name = req.headers['tusername'];
  try {
    const response = await axios.post(process.env.DISCORD_UPDATE_URL ? process.env.DISCORD_UPDATE_URL : "", {}, {
      headers: {
        'key': process.env.KEY,
        'uid': principal,
        'tusername': name
      }
    })
    res.end();
  } catch (e) {
    res.send({ msg: e });
    res.status(404).end();
  }
})

// Discord events listener
const token = process.env.BOT_TOKEN || "";
const permission : PermissionResolvable = "ManageRoles";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const rest = new REST({ version: '9' }).setToken(token);
client.once('ready', () => {
    console.log(`Logged : ${client.user?.tag}!`);
});
client.on('messageCreate', async message => {
    if (message.content.includes('BOOM DAO') && message.content.length >= 10) {
        // if (!message.member?.permissions.has(permission)) {
        //     return message.reply('no permission to manage roles.');
        // }
        let sender_name = message.author.username;
        if(message.author.bot) {
          return message.reply('bot accounts not allowed to post here');
        }
        const url = process.env.UID_DISCORD_FETCH_URL || "";
        const res = await axios.post(url, {}, {
          headers: {
            'key': process.env.KEY,
            'tusername': String(sender_name)
          }
        })
        let sender_uid = res.data;
        if(sender_uid == "") {
          return message.reply(`Hey ${sender_name}! You can authenticate your discord account on BOOM Gaming Guilds now and complete Quests to win rewards!`);
        }
        const response = await axios.post(process.env.PROCESS_ACTION_AS_ADMIN_URL ? process.env.PROCESS_ACTION_AS_ADMIN_URL : "", {}, {
          headers: {
            'key': process.env.KEY,
            'aid': "grant_discord_post",
            'uid': sender_uid,
          }
        })
        if (response.status == 200) {
          message.reply(`Hey ${sender_name}! Thank you for your kind words. We welcome you to BOOM Gaming Guild and appreciate all the feedbacks!`);
        }
        
        // To grant any role to the user after he made the post
        // try {
        //     await rest.put(
        //         Routes.guildMemberRole(message.guild ? message.guild.id : '', userId, roleId),
        //         { headers: { Authorization: `Bot ${client.token}` } }
        //     );
        //     message.reply(`Assigned role <@&${roleId}> to <@${userId}>.`);
        // } catch (error) {
        //     console.error(`Failed : ${error}`);
        //     message.reply('Failed to assign role.');
        // }
    }
});
client.login(token);

app.use(express.static('/dist'));
app.listen(port, () => { console.log("listening on " + { port }) });