import { config } from 'dotenv';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import axios from 'axios';

config();

const port = process.env.PORT || 3000;

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj: Express.User, done) {
  done(null, obj);
});

const app = express();

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
    console.log(req.query.userId);
    console.log(data.id);
    const response = await axios.post(process.env.UPDATE_URL? process.env.UPDATE_URL : "", {}, {
      headers: {
        'key' : process.env.KEY,
        'tid' : data.id,
        'uid' : String(uid)
      }
    })
    if(response.status == 200) {
      res.end(
        `<h1>You have successfully linked your Twitter account to BOOM Gaming Guild. ${response.data}</h1> You can now head back and complete BGG Quests.</pre>`
      );
    } else {
      res.end(
        `${response.data}`
      );
    }
  }
);

app.use(express.static('/dist'));
app.listen(port, () => { console.log("listening on " + { port }) });