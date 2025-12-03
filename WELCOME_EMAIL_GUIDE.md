# ✅ **WELCOME EMAIL — BREVO HTML TEMPLATE**

This is a **production-ready HTML email template** designed to match the **Sempre Studios** platform theme and styling. You can paste this directly into **Brevo (Sendinblue) Code Editor** for your **Welcome Email** sent to clients after they're added to the platform.

## Features

✅ Setup code (as a variable)  
✅ Create Password button with brand colors  
✅ Fallback plain link  
✅ Mobile-friendly layout  
✅ Professional design matching Sempre Studios theme  
✅ Overview of Sempre Studios Hub  
✅ Benefits section for clients  
✅ Works with Brevo variables like `{{ params.setup_code }}` and `{{ params.create_password_url }}`  
✅ Brand colors: `#737373`, `#d1ff75`, `#171717`  
✅ Orbitron font for "Sempre Studios" branding  

---

## 🎨 **Design Details**

This template matches the Sempre Studios platform design:

- **Background Color**: `#171717` (dark theme)
- **Text Colors**: `#737373` (gray) for secondary text, white for primary
- **Accent Color**: `#d1ff75` (lime green) for buttons and code
- **Font**: System UI stack with Orbitron for branding
- **Border Radius**: 6px-8px (matches platform)
- **Spacing**: Clean, modern spacing
- **Mobile Responsive**: Fully optimized for mobile devices

---

## 📋 **How to Use in Brevo**

1. **Open Brevo Dashboard** → Go to **Transactional** → **Email Templates**
2. **Create New Template** or edit existing welcome email template
3. **Switch to Code Editor** (HTML mode)
4. **Paste the HTML** from `WELCOME_EMAIL_TEMPLATE.html`
5. **Save** the template

---

## 🔧 **Variables You Need to Send**

Make sure your API call or automation sends these parameters:

```json
{
  "setup_code": "123456",
  "create_password_url": "https://yourapp.com/auth/create-password?code=123456&token=xyz"
}
```

Brevo will automatically replace:

- `{{ params.setup_code }}` → The setup/activation code
- `{{ params.create_password_url }}` → The full URL to create password page

---

## 📧 **Example API Call**

```javascript
// Example using Brevo API
const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.authentications.apiKey.apiKey = 'YOUR_API_KEY';

const sendSmtpEmail = new brevo.SendSmtpEmail();
sendSmtpEmail.subject = 'Welcome to Sempre Studios';
sendSmtpEmail.templateId = YOUR_TEMPLATE_ID; // The ID of the template you created
sendSmtpEmail.to = [{ email: 'client@example.com', name: 'Client Name' }];
sendSmtpEmail.params = {
  setup_code: '123456',
  create_password_url: 'https://se-hub.vercel.app/auth/create-password?code=123456&token=xyz'
};

apiInstance.sendTransacEmail(sendSmtpEmail);
```

---

## 🎯 **Template Structure**

1. **Header**: "Sempre Studios" branding with Orbitron font
2. **Title**: "Welcome to Sempre Studios"
3. **Welcome Message**: Brief introduction and instructions
4. **Setup Code**: Large, prominent code display in branded box
5. **Button**: Primary action button to create password
6. **About Section**: Overview of what Sempre Studios Hub is
7. **Benefits Section**: List of benefits for the client's business
8. **Fallback Link**: Plain text link if button doesn't work
9. **Notice**: Code expiration and contact information
10. **Footer**: Sempre Studios branding

---

## 📱 **Mobile Compatibility**

- Responsive table-based layout
- Max-width: 560px
- Touch-friendly button (min 44px height)
- Readable font sizes (16px body, 14px secondary)
- Proper spacing for mobile screens
- Optimized code box for small screens
- Text wraps properly on all devices

---

## ✨ **Content Sections**

### About Sempre Studios Hub
The template includes a brief overview explaining that Sempre Studios Hub is a centralized platform for managing business digital presence.

### Benefits for Business
The template lists key benefits:
- Centralized management of digital assets
- Real-time analytics and performance tracking
- Streamlined workflows
- Enhanced collaboration
- Secure and reliable platform

---

## 🔒 **Security Best Practices**

- Code expires in 7 days (update in your backend)
- Clear instructions included
- Secure HTTPS links
- Professional welcome message

---

## 📝 **Testing Checklist**

Before going live, test:

- [ ] Code displays correctly
- [ ] Button links to correct create password URL
- [ ] Fallback link works
- [ ] Mobile view looks good
- [ ] Dark mode email clients (Gmail dark mode)
- [ ] All variables are replaced correctly
- [ ] Branding is correct
- [ ] Content sections are readable
- [ ] Benefits list displays properly

---

## 🚀 **Ready to Use**

The template is production-ready and matches your platform's design system. Just paste it into Brevo and configure your variables!

---

## 🔄 **Differences from Password Reset Email**

- **Title**: "Welcome to Sempre Studios" instead of "Reset Password"
- **Code Variable**: `{{ params.setup_code }}` instead of `{{ params.reset_code }}`
- **URL Variable**: `{{ params.create_password_url }}` instead of `{{ params.reset_url }}`
- **Button Text**: "Create Password" instead of "Reset Password"
- **Content**: Includes overview and benefits sections
- **Expiration**: 7 days instead of 1 hour
- **Tone**: Welcoming and informative instead of security-focused

---

**Need help?** Check the Brevo documentation or contact your development team.
