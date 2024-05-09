import 'dotenv/config';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj: Express.User, done) {
  done(null, obj);
});

// Use the Twitter OAuth2 strategy within Passport
passport.use(
  new Strategy( 
    {
      clientID: process.env['TWITTER_CLIENT_ID'] as string,
      clientSecret: process.env['TWITTER_CLIENT_SECRET'] as string,
      clientType: 'confidential',
      callbackURL: `http://localhost:3000/auth/twitter/callback`,
    },
    (accessToken : string, refreshToken : string, profile, done) => {
      console.log('Success!', { accessToken, refreshToken });
      console.log(profile);
      console.log(done);
      return done(null, profile);
    }
  )
);

const app = express();

app.use(passport.initialize());
app.use(
  session({ secret: 'keyboard cat', resave: false, saveUninitialized: true })
);

app.get(
  '/',
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
  })
);

app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter'),
  function (req, res) {
    const userData = JSON.stringify(req.user, undefined, 2);
    res.end(
      // `<h1>Authentication succeeded</h1> User data: <pre>${userData}</pre>`
      `<h1>Authentication succeeded</h1> You can now head back and complete BOOM DAO Quests.</pre>`
    );
  }
);

app.use(express.static('/dist'));
app.listen(3000, () => {console.log("listening")});