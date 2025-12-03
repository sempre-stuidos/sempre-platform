# ✅ **PASSWORD RESET EMAIL — BREVO HTML TEMPLATE**

This is a **production-ready HTML email template** designed to match the **Sempre Studios** platform theme and styling. You can paste this directly into **Brevo (Sendinblue) Code Editor**.

## Features

✅ Reset code (as a variable)  
✅ Reset button with brand colors  
✅ Fallback plain link  
✅ Mobile-friendly layout  
✅ Professional design matching Sempre Studios theme  
✅ Works with Brevo variables like `{{ params.reset_code }}` and `{{ params.reset_url }}`  
✅ Brand colors: `#667eea` (primary purple-blue)  
✅ Modern gradient header  
✅ Security notice section  

---

## 🎨 **Design Details**

This template matches the Sempre Studios platform design:

- **Primary Color**: `#667eea` (purple-blue gradient)
- **Font**: System UI stack (matches platform)
- **Border Radius**: 6px-10px (matches platform)
- **Spacing**: Clean, modern spacing
- **Background**: Light theme for email compatibility
- **Branding**: Sempre Studios header with gradient

---

## 📋 **How to Use in Brevo**

1. **Open Brevo Dashboard** → Go to **Transactional** → **Email Templates**
2. **Create New Template** or edit existing password reset template
3. **Switch to Code Editor** (HTML mode)
4. **Paste the HTML** from `PASSWORD_RESET_EMAIL_TEMPLATE.html`
5. **Save** the template

---

## 🔧 **Variables You Need to Send**

Make sure your API call or automation sends these parameters:

```json
{
  "reset_code": "123456",
  "reset_url": "https://yourapp.com/auth/reset-password?code=123456&token=xyz"
}
```

Brevo will automatically replace:

- `{{ params.reset_code }}` → The 6-digit reset code
- `{{ params.reset_url }}` → The full reset URL

---

## 📧 **Example API Call**

```javascript
// Example using Brevo API
const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.authentications.apiKey.apiKey = 'YOUR_API_KEY';

const sendSmtpEmail = new brevo.SendSmtpEmail();
sendSmtpEmail.subject = 'Reset Your Password - Sempre Studios';
sendSmtpEmail.templateId = YOUR_TEMPLATE_ID; // The ID of the template you created
sendSmtpEmail.to = [{ email: 'user@example.com', name: 'User Name' }];
sendSmtpEmail.params = {
  reset_code: '123456',
  reset_url: 'https://se-hub.vercel.app/auth/reset-password?code=123456&token=xyz'
};

apiInstance.sendTransacEmail(sendSmtpEmail);
```

---

## 🎯 **Template Structure**

1. **Header**: Gradient purple-blue header with "Sempre Studios" branding
2. **Title**: "Password Reset Request"
3. **Body**: Friendly greeting and instructions
4. **Reset Code**: Large, prominent code display in branded box
5. **Button**: Primary action button with brand color
6. **Fallback Link**: Plain text link if button doesn't work
7. **Security Notice**: Yellow notice box with expiration info
8. **Footer**: Sempre Studios branding and tagline

---

## 📱 **Mobile Compatibility**

- Responsive table-based layout
- Max-width: 600px
- Touch-friendly button (min 44px height)
- Readable font sizes (16px body, 14px secondary)
- Proper spacing for mobile screens

---

## ✨ **Customization**

If you need to customize:

- **Colors**: Search and replace `#667eea` with your color
- **Branding**: Update "Sempre Studios" text
- **Expiration Time**: Change "1 hour" in security notice
- **Fonts**: Modify the `font-family` in the body tag

---

## 🔒 **Security Best Practices**

- Code expires in 1 hour (update in your backend)
- Clear security notice included
- No sensitive data in email
- Uses secure HTTPS links

---

## 📝 **Testing Checklist**

Before going live, test:

- [ ] Code displays correctly
- [ ] Button links to correct URL
- [ ] Fallback link works
- [ ] Mobile view looks good
- [ ] Dark mode email clients (Gmail dark mode)
- [ ] All variables are replaced correctly
- [ ] Branding is correct

---

## 🚀 **Ready to Use**

The template is production-ready and matches your platform's design system. Just paste it into Brevo and configure your variables!

---

**Need help?** Check the Brevo documentation or contact your development team.
