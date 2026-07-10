# Kcal — Auth email templates

Branded HTML for Supabase's auth emails, matched to the app's look (flame logo,
emerald `#10b981` accent, clean white card on `#F0F1EE`, bold Outfit-style type).

## How to apply
Supabase dashboard → **Authentication → Emails → Templates**. For each template
below, open it, switch the editor to the **HTML / source** view, **replace** the
default content with the matching file's contents, and **Save**. The editor has a
live preview pane so you can see it before saving.

| Supabase template        | File                      | Variable(s) used                        |
|--------------------------|---------------------------|-----------------------------------------|
| Confirm signup           | `confirm-signup.html`     | `{{ .ConfirmationURL }}`                 |
| Magic Link               | `magic-link.html`         | `{{ .ConfirmationURL }}`                 |
| Reset Password           | `reset-password.html`     | `{{ .ConfirmationURL }}`                 |
| Invite user              | `invite.html`             | `{{ .ConfirmationURL }}`                 |
| Change Email Address     | `change-email.html`       | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |
| Reauthentication         | `reauthentication.html`   | `{{ .Token }}` (6-digit code, not a link)|

The app actively uses the first three (sign-up confirmation, magic link, password
reset); the others are included so nothing is left on the Supabase default.

## Notes / gotchas
- **Logo image:** each template loads the logo from
  `https://kcal.abishekre.in/icon-192.png`. This must be the **real PNG** (ships
  after the icon fix is redeployed). Many mail clients block remote images until
  the reader clicks "show images" — the `alt="Kcal"` text covers that.
- **Fonts:** email clients rarely load web fonts, so these use a bold system
  sans-serif stack (`Outfit` first, then Segoe/Roboto/Helvetica/Arial). It reads
  clean everywhere; only Apple Mail is likely to render actual Outfit.
- **Outlook:** the CTA button renders as a solid emerald rectangle (Outlook
  ignores `border-radius`) — still on-brand, just not rounded.
- **Expiry copy:** the templates state 24h for signup confirmation and 1h for
  magic link / reset / reauthentication. If you change the OTP/link expiry in
  **Auth → Providers/Sessions**, update the wording to match.
- **Subject lines:** set these in the dashboard (they're separate from the HTML
  body). Suggested: "Confirm your email", "Your Kcal sign-in link",
  "Reset your Kcal password", "You're invited to Kcal", "Confirm your new email",
  "Your Kcal verification code".
