# OAuth Authentication Setup

## Introduction
This project now supports login with Google and Facebook. This document explains the steps needed to finish setting up OAuth authentication.

## Prerequisites
1. A Google Cloud Platform account for Google login
2. A Facebook developer account for Facebook login

## Setup Steps

### 1. Google OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set the application type to "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:5001/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`
7. Note your Client ID and Client Secret

### 2. Facebook OAuth
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the Facebook Login product to your app
4. In Facebook Login settings, add these OAuth Redirect URIs:
   - Development: `http://localhost:5001/api/auth/facebook/callback`
   - Production: `https://your-domain.com/api/auth/facebook/callback`
5. Note your App ID and App Secret

### 3. Environment Variables
Add these variables to your `.env` file:

```
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## Testing
1. Start your development server
2. Visit the login page
3. Click on "Sign in with Google" or "Sign in with Facebook"
4. You should be redirected to the respective login page
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting
- Make sure redirect URIs are correctly set up
- Check that environment variables are properly configured
- Look for errors in browser console and server logs
- Verify CORS settings if you encounter cross-origin issues
