

# FUN Public Landing Profile -- Upgrade Plan

This is a large enhancement to transform `fun.rich/{handle}` into a full "personal brand page + SuperApp gateway." The work is organized into phases to deliver value incrementally.

---

## Phase 1: Database Foundation (Privacy Settings + Profile Fields)

**New table: `profile_public_settings`**
- `user_id` (PK, references profiles)
- `public_profile_enabled` (bool, default true)
- `allow_public_message` (bool, default true)
- `allow_public_transfer` (bool, default true)
- `allow_public_follow` (bool, default true)
- `show_friends_count` (bool, default true)
- `show_stats` (bool, default true)
- `show_modules` (bool, default true)
- `show_donation_button` (bool, default false)
- `enabled_modules` (jsonb, default all modules)
- `featured_items` (jsonb, default null -- for pinned content)
- `tagline` (text, nullable -- one-line description)
- `badge_type` (text, nullable -- 'founder'/'verified'/'cosmic_coach'/'business')
- `created_at`, `updated_at`
- RLS: owner can read/write; anyone can read (for public profile display)

**New table: `profile_view_events`** (for analytics)
- `id` (uuid PK)
- `profile_user_id` (uuid)
- `viewer_user_id` (uuid, nullable -- null if anonymous)
- `event_type` (text -- 'view', 'follow_click', 'message_click', 'transfer_click', 'module_open', 'signup_start')
- `referrer_handle` (text, nullable)
- `created_at`
- RLS: insert for anyone; select for profile owner only

**Add `tagline` column to `profiles` table** (or keep it in `profile_public_settings` -- keeping in settings table is cleaner).

---

## Phase 2: Privacy-Aware Public Profile Hook

Update `usePublicProfile.ts`:
- Fetch `profile_public_settings` alongside profile data
- Return privacy flags so UI components can conditionally hide/show sections
- Respect `public_profile_enabled` (show 404 if disabled)

---

## Phase 3: UI Enhancements

### 3.1 Header Upgrade
- Add **tagline** display below bio
- Add **badge** display (Founder / Verified / Cosmic Coach / Business) as a colored chip next to display name
- Improve "3-second clarity" layout

### 3.2 Privacy-Aware Stats
- `PublicProfileStats`: hide if `show_stats === false`
- `PublicProfileFriends`: hide friends count if `show_friends_count === false`

### 3.3 Privacy-Aware Actions
- Message button: show "Chỉ bạn bè" (Friends only) if `allow_public_message === false` and viewer is not a friend
- Transfer/Gift button: show locked state if `allow_public_transfer === false` and not friend
- Donation mode: show "Donate" button if `show_donation_button === true`

### 3.4 Module Gateway (Filtered)
- `FunWorldsTiles`: only show modules from `enabled_modules` list instead of all modules
- Each tile shows icon + name + description + "Open" CTA

### 3.5 Featured Content Section (New)
- New component `PublicProfileFeatured.tsx`
- Display pinned items from `featured_items` JSON (1 video, 1 post, 1 course, 1 product, 1 campaign)
- Each item shows thumbnail, title, and link

### 3.6 "Ask Angel About This Person" Button (New)
- New component `AskAngelButton.tsx`
- Opens a modal that calls the existing `angel-chat` edge function with a special prompt
- Only returns public and permissioned data
- Displays AI summary of the person's public activity

---

## Phase 4: Viral Growth Features

### 4.1 Referral Param Support
- Parse `?ref=handle` from URL in `HandleProfile.tsx`
- Store referrer in localStorage
- After signup, record referral in a new `referrals` column or use existing tracking

### 4.2 Auto-Follow After Join
- After signup from a profile link, redirect back to the profile
- Show a "Follow [Name] now?" prompt (1-click)

### 4.3 OpenGraph Meta Tags
- Add dynamic OG meta tags in `index.html` using a lightweight approach
- Since this is a SPA, create a small edge function `og-profile` that returns OG-optimized HTML for crawlers
- Tags: og:title (display name), og:description (tagline/bio), og:image (avatar)

---

## Phase 5: Profile Settings UI

### 5.1 Privacy Settings in Profile Page
- Add a new section in `src/pages/Profile.tsx` for "Public Profile Settings"
- Toggle switches for each privacy flag
- Module selector (checkboxes for which FUN Worlds to show)
- Featured content picker (select posts/content to pin)
- Badge selection (if eligible)
- Tagline input field

---

## Phase 6: Event Tracking

- Create `trackProfileEvent()` utility function
- Insert events into `profile_view_events` table
- Track: profile views, follow clicks, message clicks, transfer clicks, module opens, signup starts

---

## Technical Details

### Files to Create
1. `src/components/public-profile/PublicProfileFeatured.tsx` -- Featured/pinned content section
2. `src/components/public-profile/AskAngelButton.tsx` -- "Ask Angel" AI integration
3. `src/components/public-profile/ProfileBadge.tsx` -- Badge chip component
4. `src/hooks/useProfilePublicSettings.ts` -- Hook for privacy settings CRUD
5. `src/lib/profileEvents.ts` -- Event tracking utility

### Files to Modify
1. `src/hooks/usePublicProfile.ts` -- Add privacy settings fetch, respect flags
2. `src/pages/HandleProfile.tsx` -- Add referral param parsing, new sections, event tracking
3. `src/components/public-profile/PublicProfileHeader.tsx` -- Add tagline + badge
4. `src/components/public-profile/PublicProfileActions.tsx` -- Respect privacy flags (friends-only lock)
5. `src/components/public-profile/PublicProfileStats.tsx` -- Conditional display based on privacy
6. `src/components/public-profile/PublicProfileFriends.tsx` -- Conditional display
7. `src/components/public-profile/FunWorldsTiles.tsx` -- Filter by enabled_modules
8. `src/components/public-profile/PublicProfileJoinCTA.tsx` -- Add auto-follow logic
9. `src/pages/Profile.tsx` -- Add privacy settings section

### Database Migration
- Create `profile_public_settings` table with RLS policies
- Create `profile_view_events` table with RLS policies
- Auto-create settings row via trigger when profile is created

### Estimated Scope
This is a substantial feature set. The implementation will be done progressively, starting with the database foundation and core privacy controls, then layering on UI enhancements and viral features.

