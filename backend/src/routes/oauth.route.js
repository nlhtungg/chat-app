// Custom OAuth handling routes that don't interfere with the main JWT authentication
import express from 'express';
import passport from 'passport';
import { googleAuthCallback, facebookAuthCallback } from '../controllers/auth.controller.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // Ensure session is not used since we're using JWT
}));

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: process.env.NODE_ENV === 'production' ? '/login' : 'http://localhost:5173/login?error=true',
        session: false
    }),
    googleAuthCallback
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email'],
    session: false
}));

router.get('/facebook/callback', 
    passport.authenticate('facebook', { 
        failureRedirect: process.env.NODE_ENV === 'production' ? '/login' : 'http://localhost:5173/login?error=true',
        session: false
    }),
    facebookAuthCallback
);

export default router;
