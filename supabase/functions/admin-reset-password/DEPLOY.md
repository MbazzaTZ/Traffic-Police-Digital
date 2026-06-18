# Deploying `admin-reset-password` Edge Function

This function is what lets the admin "Reset Password" button on the
Officers page actually work. Until it's deployed, the button will
return a "Function not found" error.

## One-time setup (on your Windows machine)

### 1. Install the Supabase CLI

If you don't have it already:

```powershell
# Option A: via Scoop (recommended on Windows)
scoop install supabase

# Option B: via npm
npm install -g supabase

# Verify
supabase --version
```

### 2. Log in and link the project

```powershell
cd "C:\Users\DELL\Documents\Tanzania Police Force\Jeshi"

# Opens a browser to log in to Supabase
supabase login

# Link this folder to your Supabase project
supabase link --project-ref mrqwrwnactvltdtlajzd
```

The CLI will ask for your database password — that's the one you set
when you created the project, not the dashboard password. If you've
forgotten it, you can reset it in the Supabase dashboard → Project
Settings → Database → "Reset database password".

### 3. Set the SERVICE_ROLE_KEY secret

The function needs the service-role key to modify other users'
passwords. **Never put this key in your client code.** It lives only
in the function's environment.

Get the key from Supabase dashboard → Project Settings → API →
**service_role** (it's the second key on that page, with a "secret"
label). Copy it.

Then set it as a function secret:

```powershell
supabase secrets set SERVICE_ROLE_KEY=<paste_the_key_here>
```

> **Important:** the env var is called `SERVICE_ROLE_KEY` (without the
> `SUPABASE_` prefix). The Supabase CLI reserves env names that start
> with `SUPABASE_` for its own automatic injection, so trying to set
> `SUPABASE_SERVICE_ROLE_KEY` from the CLI will fail with "Env name
> cannot start with SUPABASE_, skipping". The function code reads
> from `SERVICE_ROLE_KEY` and also accepts `SUPABASE_SERVICE_ROLE_KEY`
> if you set it via the dashboard UI.

Verify it's set:

```powershell
supabase secrets list
```

You should see `SERVICE_ROLE_KEY` in the output (the value itself is
redacted, which is correct).

### ⚠️ Troubleshooting: `.env` file parse error

If you get this error during `supabase link` or `supabase functions deploy`:

```
failed to parse environment file: .env (unexpected character '\x00' in variable name)
```

The CLI is trying to auto-load a `.env` file in your project directory
that has bad encoding (usually a null byte from Notepad saving as UTF-16).

`.env` is **separate from** `.env.local`. Your app uses `.env.local`
for its Supabase URL; `.env` is something else - probably leftover.
Delete it:

```powershell
Remove-Item .env -ErrorAction SilentlyContinue
```

Then re-run the supabase command.

### 4. Deploy the function

```powershell
supabase functions deploy admin-reset-password --no-verify-jwt
```

The `--no-verify-jwt` flag is important. Our function does its OWN
JWT verification (plus an admin-role check) inside `index.ts`. The
Supabase platform's built-in JWT verification would reject calls
before our role check runs, breaking the flow.

The deploy takes 30-60 seconds. When it finishes you'll see the
function URL printed.

## Test that it works

1. Make sure you're logged in to the app as an admin
2. Officers page → click the orange key icon on any non-admin row
3. Type a new password (or click "Generate Strong Password")
4. Confirm it
5. Click "Reset Password"

You should see the green "Password reset successful" panel showing
the email and new password. Try logging in as that officer with the
new password — it works.

## Troubleshooting

### "Function not found" error
The function isn't deployed yet. Run step 4 above.

### "Permission denied - admin role required"
The caller's profile row doesn't have role `admin_officer`, `igp`,
or `digp`. Check `select role from public.profiles where id = '...'`.

### "Caller profile not found"
The caller's auth user has no matching row in `public.profiles`. This
shouldn't happen for logged-in users but might if a recent rollback
left orphaned auth rows.

### "Missing Authorization header"
The client's session expired. Have the admin sign out and back in.

### Internal server error / 500
Open the function logs:

```powershell
supabase functions logs admin-reset-password
```

The error message in the logs will say what's wrong - usually a
missing `SUPABASE_SERVICE_ROLE_KEY` secret (step 3).

## Updating the function later

If you change `index.ts`, redeploy:

```powershell
supabase functions deploy admin-reset-password --no-verify-jwt
```

The change is live immediately - no app rebuild needed.
