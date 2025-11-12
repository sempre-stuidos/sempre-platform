# Detailed OAuth Consent Screen Setup Guide

## Step-by-Step Instructions

### Step 1: Access OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project from the dropdown at the top
3. In the left sidebar, click **APIs & Services**
4. Click **OAuth consent screen**

### Step 2: Complete the Setup Wizard

If you see a setup wizard, follow these steps:

#### **App Information (Step 1)**
- **User Type**: Choose **External** (unless you have a Google Workspace account)
- **App name**: Enter your app name (e.g., "Sempre Studios")
- **User support email**: Select your email from dropdown
- **App logo**: (Optional) Upload a logo
- **Application home page**: (Optional) Your website URL
- **Application privacy policy link**: (Optional)
- **Application terms of service link**: (Optional)
- **Authorized domains**: (Optional)
- **Developer contact information**: Enter your email
- Click **SAVE AND CONTINUE**

#### **Scopes (Step 2)**
- Click **ADD OR REMOVE SCOPES**
- In the filter/search box, search for: `drive`
- Check these two scopes:
  - ✅ `https://www.googleapis.com/auth/drive.readonly` - See and download all your Google Drive files
  - ✅ `https://www.googleapis.com/auth/drive.file` - See, edit, create, and delete only the specific Google Drive files you use with this app
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

#### **Test users (Step 3) - THIS IS WHERE YOU ADD YOUR EMAIL!**
- Click **+ ADD USERS**
- Enter your email address: `yolxanderjaca@gmail.com`
- Click **ADD**
- You should see your email in the list
- Click **SAVE AND CONTINUE**

#### **Summary (Step 4)**
- Review your settings
- Click **BACK TO DASHBOARD**

### Step 3: If You Don't See Test Users Section

If the OAuth consent screen is already set up but you don't see the Test users section:

1. **Look for an "EDIT APP" button** at the top of the page
2. Click **EDIT APP**
3. This will take you through the steps again
4. Navigate to the **Test users** step (Step 3)
5. Add your email there

### Step 4: Alternative Method - Direct Access

If you still can't find it:

1. Make sure you're on the **OAuth consent screen** page
2. Look for tabs or sections at the top:
   - **App information**
   - **Scopes**
   - **Test users** ← Click this tab
3. If you see a **"PUBLISHING STATUS"** section showing "Testing", the Test users section should be right below it

### Step 5: Verify Test User Was Added

After adding your email:
- You should see it listed under "Test users"
- The status should show "Testing" (not "In production")
- Wait 2-3 minutes for changes to take effect

### Troubleshooting

**Q: I don't see "Test users" anywhere**
- Make sure you've completed the OAuth consent screen setup
- Try clicking "EDIT APP" to go through setup again
- Make sure you're on the correct project

**Q: I see "PUBLISH APP" button but no test users**
- Click "EDIT APP" first
- Then navigate to the Test users step
- Or look for a "Test users" tab/section

**Q: The page looks different**
- Google sometimes updates their UI
- Look for any section related to "users", "testing", or "access"
- Try searching the page (Ctrl+F / Cmd+F) for "test user"

### Visual Guide

The OAuth consent screen page should show:
```
┌─────────────────────────────────────┐
│ OAuth consent screen                │
│ [EDIT APP] button                   │
├─────────────────────────────────────┤
│ Publishing status: Testing          │
│                                     │
│ Test users                          │
│ ┌─────────────────────────────────┐ │
│ │ + ADD USERS                    │ │
│ │                                │ │
│ │ yolxanderjaca@gmail.com        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

If you still can't find it, take a screenshot of your OAuth consent screen page and I can help you locate it!

