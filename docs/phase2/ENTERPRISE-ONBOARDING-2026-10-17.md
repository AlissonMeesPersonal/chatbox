# Viante — Enterprise onboarding, CEO invites and tenant isolation

## Repository / deployment
- Code and SQL schema tracked on \`main\`; Vercel production deploys automatically.
- Supabase project: \`idmqygvbtofkmbccazyp\`.
- Public test URL: https://chatbox-cyan-five.vercel.app
- \`/login\` is Supabase Auth; \`/admin\` is reserved for CEO; \`/app\` is the authenticated company environment; \`/demo\` is fictitious.

## CEO workflow
1. Confirm email, enroll MFA, and claim reserved CEO status.
2. Open \`/admin\`, create a company (name and unique slug).
3. On its card, enter the owner email and click **Enviar convite ao proprietário**.
4. The server, under the verified CEO bearer token, executes \`viante_ceo_invite_owner\` (private definer checks AAL2 and platform-admin record).
5. Only after that succeeds the server asks Supabase Auth to send an OTP / magic link, redirected to \`/auth/finish?flow=invite&invite=<uuid>\`.
6. Pending invites can be revoked from the CEO dashboard. Reissued invites get new UUIDs, invalidating previous invite IDs. An accepted invitation cannot be reissued.

## Invited owner workflow
1. Receive email from Supabase Auth, open the one-time link, and confirm identity.
2. \`/auth/finish\` exchanges the fragment token into server HttpOnly cookies, then goes to \`/accept-invite?invite=<uuid>\`.
3. Enroll / verify TOTP MFA (\`aal2\`).
4. \`viante_accept_invite\` validates email confirmation against **auth.users**, invoker AAL2, the pending unexpired invitation ID, and bans platform admins from joining tenants.
5. The function inserts an ACTIVE owner membership only for the invitation's organization. Replaying an accepted invitation cannot reactivate a suspended membership.
6. Owner defines a personal password on \`/reset-password\` and accesses \`/app\`.
7. Owners (or authorized admins) can add company units with another MFA-gated and database-authorized RPC.

## Security and scope
- \`public.viante_invitations\` has RLS enabled; no direct table SELECT privileges; explicit deny SELECT policy. Invitations are only accessible through narrowly scoped RPCs.
- The recipient cannot select a target organization or role when claiming.
- Protected routes always validate the bearer token with Supabase Auth and recheck database memberships / platform-admin records. UI checks are not the only authorization.
- Cookies are HttpOnly / SameSite Lax / Secure in production. Form mutation endpoints enforce same origin.
- One platform CEO does not appear as a tenant member.
- This step does NOT provide tenant-created staff invitations, subscription billing, WhatsApp messaging, or a real Inbox. Those remain future work.

## Go-live setup that must be checked manually
- Supabase -> Authentication -> URL Configuration: Site URL \`https://chatbox-cyan-five.vercel.app\` and allowlist redirect \`https://chatbox-cyan-five.vercel.app/**\`.
- Supabase Auth Email provider enabled; use production-grade SMTP before commercial use; inspect email rate limits.
- Security Advisor currently warns leaked-password protection disabled. Enable it in Supabase Auth security settings.
- Complete end-to-end tests with a REAL, user-owned recipient email: CEO create company -> send link -> recipient link -> MFA -> password -> /app -> create unit -> CEO revoke a pending invitation. Do not claim these steps were tested before doing them.
- Monitor rate limits and email delivery errors. Server display "invitation requested" indicates the Auth API request was accepted, not proof of inbox delivery.
