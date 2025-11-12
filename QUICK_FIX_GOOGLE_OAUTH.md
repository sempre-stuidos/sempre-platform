# Quick Fix: Google OAuth "Access Denied" Error

## Error Message
```
Access blocked: Sempre Studios has not completed the Google verification process
Error 403: access_denied
```

## Quick Solution (2 minutes)

Your OAuth app is in "Testing" mode. You need to add your email as a test user:

### Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Consent Screen**
   - **If you're on "OAuth Overview" page**: Look in the left sidebar under "Google Auth Platform" → Click **"OAuth consent screen"**
   - **OR**: Click **APIs & Services** in the left menu → Click **OAuth consent screen**
   - **OR**: Use the search bar at the top and search for "OAuth consent screen"

3. **Complete OAuth Consent Screen Setup (if not done)**
   - If you see a setup wizard, complete these steps:
     - **Step 1 (App information)**: 
       - Choose **External** (unless you have Google Workspace)
       - Fill in App name, User support email, Developer contact
       - Click **Save and Continue**
     - **Step 2 (Scopes)**: 
       - Click **Add or Remove Scopes**
       - Add: `https://www.googleapis.com/auth/drive.readonly`
       - Add: `https://www.googleapis.com/auth/drive.file`
       - Click **Update** then **Save and Continue**
     - **Step 3 (Test users)** ← **THIS IS WHERE YOU ADD YOUR EMAIL**
       - Click **+ ADD USERS**
       - Enter your email: `yolxanderjaca@gmail.com`
       - Click **Add**
       - Click **Save and Continue**
     - Complete remaining steps (Summary, etc.)

4. **If OAuth Consent Screen is Already Set Up:**
   - On the OAuth consent screen page, look for:
     - A section called **"Test users"** (usually near the bottom)
     - Or a button/link that says **"ADD USERS"** or **"MANAGE TEST USERS"**
     - If you don't see it, click **"EDIT APP"** button at the top
     - This will take you through the setup steps again, where you can add test users

5. **Alternative: Direct Link to Test Users**
   - Try this direct URL (replace PROJECT_ID with your actual project ID):
     - `https://console.cloud.google.com/apis/credentials/consent?project=YOUR_PROJECT_ID`
   - Or navigate: **APIs & Services** → **OAuth consent screen** → **EDIT APP** → **Test users** tab

6. **Wait 2-3 minutes** for changes to propagate

7. **Try connecting again** - it should work now!

## If You Need to Add More Users Later

Just repeat step 3 above to add additional test user emails.

## For Production (Later)

When you're ready to make the app public:
- In **OAuth consent screen**, click **PUBLISH APP**
- Note: This may require Google verification for sensitive scopes
- For now, using test users is perfect for development

## Still Having Issues?

1. Make sure you're using the exact email address that's added as a test user
2. Wait a few minutes after adding the user (Google needs time to propagate)
3. Try clearing your browser cache and cookies
4. Make sure the OAuth consent screen is configured (see GOOGLE_DRIVE_SETUP.md)

