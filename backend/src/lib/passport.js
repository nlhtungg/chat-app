import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? '/api/auth/google/callback'
        : 'http://localhost:5001/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our database
        let user = await User.findOne({ 
          provider: 'google',
          providerId: profile.id
        });

        if (user) {
          // User exists, return the user
          return done(null, user);
        }

        // If user doesn't exist, create a new user
        // Extract profile information
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const name = profile.displayName || '';
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        // Create new user
        user = new User({
          name,
          email,
          provider: 'google',
          providerId: profile.id,
          avatar,
          // Set a random password for OAUth users since it's required by the model
          // but won't be used for authentication
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? '/api/auth/facebook/callback'
        : 'http://localhost:5001/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists in database
        let user = await User.findOne({
          provider: 'facebook', 
          providerId: profile.id
        });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // User doesn't exist, create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const name = profile.displayName || '';
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        user = new User({
          name,
          email,
          provider: 'facebook',
          providerId: profile.id,
          avatar,
          // Set a random password for OAUth users
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Since we're using JWT, we don't need traditional serialize/deserialize
// But we'll include them in case other parts of the code rely on them
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;