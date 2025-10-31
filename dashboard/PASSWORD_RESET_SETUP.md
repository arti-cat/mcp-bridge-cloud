# Password Reset Setup Guide

This guide explains how to configure Supabase email templates for the password reset feature.

## Overview

The password reset feature has been implemented with the following components:

- **Backend Functions**: `sendPasswordResetEmail()` and `updatePassword()` in `src/lib/supabaseClient.js`
- **UI Components**:
  - `ForgotPassword.svelte` - Email input form
  - `ResetPassword.svelte` - New password form
- **Routing**: Hash-based routing in `App.svelte` for `#/forgot-password` and `#/reset-password`
- **Login Integration**: "Forgot password?" link in `Login.svelte`

## Supabase Email Template Configuration

To enable password reset emails, you need to configure the Supabase email template.

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates** in the left sidebar

### Step 2: Configure "Reset Password" Template

1. Find the **"Reset Password"** template in the list
2. Click to edit it

### Step 3: Update the Redirect URL

**For Development:**
```
http://localhost:3000/#/reset-password
```

**For Production:**
```
https://yourdomain.com/#/reset-password
```

or if using the deployed domain:
```
https://dashboard.mcp-bridge.xyz/#/reset-password
```

### Step 4: Email Template (Optional Customization)

The default Supabase template should work, but you can customize it. Here's a recommended template:

**Subject:**
```
Reset your MCP Bridge Cloud password
```

**Body (HTML):**
```html
<h2>Reset your password</h2>
<p>Hello,</p>
<p>You requested to reset your password for your MCP Bridge Cloud account.</p>
<p>Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>MCP Bridge Cloud Team</p>
```

**Important Variables:**
- `{{ .ConfirmationURL }}` - The magic link that includes the reset token
- `{{ .Token }}` - The raw token (not needed if using ConfirmationURL)
- `{{ .Email }}` - The user's email address

### Step 5: Configure Site URL (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com` or `https://dashboard.mcp-bridge.xyz`
3. Add **Redirect URLs** (if not already present):
   - Development: `http://localhost:3000/#/reset-password`
   - Production: `https://yourdomain.com/#/reset-password`

### Step 6: Save Changes

Click **Save** to apply the template changes.

## User Flow

### 1. Request Password Reset
```
User clicks "Forgot password?" on login page
  ↓
Enters email address
  ↓
Clicks "Send Reset Link"
  ↓
sendPasswordResetEmail(email) called
  ↓
Supabase sends email with reset link
  ↓
Success message: "Check your email!"
```

### 2. Complete Password Reset
```
User clicks link in email
  ↓
Redirected to: http://localhost:3000/#/reset-password#access_token=xxx...
  ↓
App.svelte detects hash, loads ResetPassword component
  ↓
Supabase auto-validates token and creates temporary session
  ↓
User enters new password (twice for confirmation)
  ↓
updatePassword(newPassword) called
  ↓
Password updated in Supabase Auth
  ↓
Success message → auto-redirect to login after 3 seconds
```

## Testing the Feature

### Local Testing Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test forgot password flow:**
   - Navigate to `http://localhost:3000`
   - Click "Forgot password?" link
   - Enter a valid user email (must exist in Supabase Auth)
   - Click "Send Reset Link"
   - Check for success message

3. **Check email:**
   - Open your email client
   - Look for email from Supabase
   - Note: In development, emails might go to spam or take a few minutes

4. **Test password reset:**
   - Click the reset link in the email
   - Verify you're redirected to reset password page
   - Enter new password (min 8 characters)
   - Confirm password matches
   - Click "Update Password"
   - Wait for success message and auto-redirect

5. **Verify password changed:**
   - On login page, enter email and NEW password
   - Should successfully log in

### Common Issues

**Email not received:**
- Check Supabase email settings are configured
- Verify email address exists in Supabase Auth
- Check spam folder
- In development, Supabase might rate-limit emails

**Reset link doesn't work:**
- Verify Site URL is configured correctly in Supabase
- Check that Redirect URLs include the hash route
- Ensure link hasn't expired (1 hour default)
- Clear browser cache and try again

**"Invalid token" error:**
- Token might be expired
- Token was already used (one-time use only)
- Request a new reset link

**Password not updating:**
- Check browser console for errors
- Verify new password meets requirements (8+ chars)
- Ensure passwords match
- Check Supabase Auth logs in dashboard

## Security Features

✅ **One-time use tokens** - Reset links can only be used once
✅ **Time-limited tokens** - Links expire after 1 hour
✅ **Secure token delivery** - Tokens sent via email only
✅ **Password validation** - Minimum 8 characters required
✅ **Confirmation required** - User must enter password twice
✅ **Session invalidation** - Old sessions terminated after password change

## Environment Variables

Make sure these are set in `dashboard/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Production Deployment

When deploying to production:

1. **Update Supabase email template** with production URL
2. **Update Site URL** in Supabase to production domain
3. **Add production redirect URLs** to Supabase allowed list
4. **Test the complete flow** in production environment
5. **Monitor email delivery** using Supabase logs

## Additional Configuration (Optional)

### Custom Email Provider

By default, Supabase uses its own SMTP service. For production, you may want to configure a custom SMTP provider:

1. Go to **Authentication** → **Email Settings**
2. Enable **Custom SMTP**
3. Configure your SMTP provider (SendGrid, AWS SES, etc.)

### Email Rate Limiting

Supabase has built-in rate limiting for password reset emails to prevent abuse:
- Default: 4 requests per hour per email address
- Configure in **Authentication** → **Rate Limits**

## Support

If you encounter issues:
1. Check Supabase Auth logs: **Authentication** → **Logs**
2. Check browser console for errors
3. Verify all configuration steps above
4. Refer to [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
