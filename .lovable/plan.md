

## Make All Data Publicly Visible to Guests

The screenshot shows the issue clearly: the leaderboard displays "An danh" (Anonymous) for all users and the member count shows 0. This happened because our recent security changes restricted the `profiles` table to only logged-in users, which blocks guests from seeing any profile information.

### Root Cause

Two database access policies were recently tightened to require login:
- **profiles table**: Display names, avatars, and bios are now hidden from guests
- **user_online_status table**: Online status is hidden from guests

### What Will Change

**1. Profiles table -- restore public read access**
- Drop the current "Authenticated users can view profiles" policy (restricted to logged-in users)
- Create a new "Anyone can view profiles" policy that allows all visitors (including guests) to see profile data
- This restores the leaderboard, community posts, user profiles, and member counts for everyone

**2. Online status table -- restore public read access**
- Drop the current "Authenticated users can view online status" policy
- Create a new "Anyone can view online status" policy so guests can see who is online

**3. Update security scan findings**
- Mark the previously deleted security findings as intentionally public, since the user explicitly wants this behavior

### Pages Affected
All pages that display user profiles will benefit:
- Home page (leaderboard, top ranking, member count)
- Community page (post authors, honor boards)
- User profile pages
- Messages (online status indicators)
- Any sidebar or component showing user avatars and names

### Technical Details

A single SQL migration will be executed:

```sql
-- 1. Profiles: allow public read
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- 2. Online status: allow public read
DROP POLICY IF EXISTS "Authenticated users can view online status" ON public.user_online_status;
CREATE POLICY "Anyone can view online status"
  ON public.user_online_status FOR SELECT
  TO public
  USING (true);
```

No frontend code changes are needed -- the existing components already handle the data correctly. The only issue was that the database was blocking guests from reading the data.

