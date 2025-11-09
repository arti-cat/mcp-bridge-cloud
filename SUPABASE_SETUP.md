# Supabase Dashboard Configuration

This document outlines the required Supabase dashboard settings for email confirmation to work correctly in MCP Bridge Cloud.

## Required Configuration Steps

### 1. Enable Email Confirmation

**Location**: Authentication → Providers → Email

**Steps**:
1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Ensure **"Confirm email"** checkbox is **ENABLED**
4. Save changes

**Why**: This setting requires users to verify their email address before they can access their account. Without this, email confirmation links won't be sent.

---

### 2. Configure Redirect URLs (Allowlist)

**Location**: Authentication → URL Configuration → Redirect URLs

**Steps**:
1. Navigate to: **Authentication** → **URL Configuration**
2. Scroll to **Redirect URLs** section
3. Add the following URLs to the allowlist:

**Development**:
```
http://localhost:5173/auth/confirm
```

**Production**:
```
https://mcp-bridge.xyz/auth/confirm
```

4. Click **Add URL** for each
5. Save changes

**Why**: Supabase only allows redirects to URLs in this allowlist. If the redirect URL isn't listed here, the confirmation link will fail with "Invalid redirect URL" error.

**Important**:
- You must add BOTH development and production URLs
- The URL must match EXACTLY what's configured in `VITE_APP_URL`
- Include the `/auth/confirm` path

---

### 3. Set Site URL

**Location**: Authentication → URL Configuration → Site URL

**Steps**:
1. Navigate to: **Authentication** → **URL Configuration**
2. Find **Site URL** field
3. Set to: `https://mcp-bridge.xyz`
4. Save changes

**Why**: The Site URL is used as the base URL in email templates. It's referenced as `{{ .SiteURL }}` in email template variables.

**Development vs Production**:
- For development: You can temporarily set this to `http://localhost:5173`
- For production: Set to `https://mcp-bridge.xyz`
- Only ONE Site URL can be configured at a time

---

### 4. Email Template Configuration (Optional)

**Location**: Authentication → Email Templates → Confirm signup

**Steps**:
1. Navigate to: **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. Review the template (default is usually fine)
4. Verify it includes: `{{ .ConfirmationURL }}`

**Default Template** (simplified):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**Custom Template** (if using PKCE flow):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
    Confirm your email
  </a>
</p>
```

**Why**: The email template generates the confirmation link sent to users. The `{{ .ConfirmationURL }}` variable is automatically populated by Supabase.

**Optional Customization**:
- Update branding (logo, colors)
- Add MCP Bridge Cloud branding
- Customize messaging tone

---

## Environment Variables Required

Ensure your `.env` file (in `mcp-bridge-cloud/dashboard/`) contains:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5173
```

**Production `.env`**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://mcp-bridge.xyz
```

---

## Testing the Configuration

### 1. Test Signup Flow

1. Start development server:
   ```bash
   cd mcp-bridge-cloud/dashboard
   npm run dev
   ```

2. Navigate to signup page: `http://localhost:5173/#/signup`

3. Register with a NEW email address (use a real email you can access)

4. After submitting:
   - Should see "Check your email!" message
   - Check your inbox (and spam folder)
   - Click the confirmation link in the email

5. Should redirect to: `http://localhost:5173/auth/confirm?token_hash=...&type=email`

6. Should see "Email Confirmed!" message

7. Should auto-redirect to dashboard after 2 seconds

### 2. Common Issues & Solutions

**Problem**: "Invalid redirect URL" error
- **Solution**: Add redirect URL to allowlist (step 2 above)

**Problem**: No email received
- **Check**:
  - Email confirmation is enabled (step 1)
  - Spam/junk folder
  - Supabase email rate limits (60 emails/hour default)
  - Email provider's SMTP configuration

**Problem**: Confirmation link doesn't work
- **Check**:
  - Redirect URL matches EXACTLY (including `/auth/confirm` path)
  - Site URL is configured correctly
  - AuthConfirm.svelte component is rendering

**Problem**: "Email already registered" error
- **Solution**: User already exists. Either:
  - Use a different email
  - Delete the existing user from Supabase dashboard (Authentication → Users)

---

## Rate Limits

Be aware of Supabase's default rate limits:

**Email Sending**:
- **30-60 emails per hour** (using built-in SMTP)
- For higher volumes, configure custom SMTP provider

**Signup Confirmation Cooldown**:
- **60 seconds** between confirmation requests per user
- Prevents spam/abuse

**Solution for Production**:
- Configure custom SMTP provider (SendGrid, Mailgun, AWS SES)
- Go to: **Project Settings** → **Authentication** → **SMTP Settings**

---

## Verification Checklist

Before deploying to production, verify:

- [ ] Email confirmation is enabled
- [ ] Development redirect URL added: `http://localhost:5173/auth/confirm`
- [ ] Production redirect URL added: `https://mcp-bridge.xyz/auth/confirm`
- [ ] Site URL set to production domain: `https://mcp-bridge.xyz`
- [ ] Email template reviewed and customized (optional)
- [ ] Environment variables configured in `.env`
- [ ] Tested signup flow end-to-end
- [ ] Email delivery confirmed (check inbox + spam)
- [ ] Confirmation link works
- [ ] Redirect to dashboard after confirmation

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Confirmation Guide](https://supabase.com/docs/guides/auth/auth-email)
- [URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

---

## Support

If you encounter issues:

1. Check Supabase logs: **Logs** → **Auth Logs**
2. Review browser console for JavaScript errors
3. Verify network requests in browser DevTools
4. Check email delivery in Supabase dashboard

**Last Updated**: 2025-11-09
