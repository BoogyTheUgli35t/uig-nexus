# Plan: Search Console, landing page, real tenant/investor data, idea comments

## 1. Connect Google Search Console and submit the sitemap
- Open the Google Search Console connect card so you can sign in with the Google account that owns nexus.unifiedinnovationsgroup.online.
- List your verified properties. If the nexus site is already verified, use it. If not, request a verification tag, add it to the site's page header, and ask you to publish (the nexus domain is served from your Cloudflare deploy, so the tag must reach that build too), then verify.
- Check that https://nexus.unifiedinnovationsgroup.online/sitemap.xml is live and lists only nexus URLs, then submit it.
- Confirm the redirect domain is not listed in the sitemap or robots file.

## 2. Landing page
- Rework the home page into a proper landing page: headline, short value statement, primary button "Sign in" to /portal/login, secondary "Explore divisions" to /divisions.
- Six division cards (accent colour, tagline, live module list from the shared division data) each linking to its division page.
- Proof strip pulled from live counts (properties, farmers, shipments, ideas) using the updated schema.
- Unique page title, description and share tags.

## 3. Real Nigerian tenant and investor profiles
- Add 8 tenants and 6 investors with Nigerian names, Lagos/Abuja/Port Harcourt properties and units, lease dates, rent in naira, investment amounts and expected returns.
- Link one tenant and one investor to your own account so your tenant and investor dashboards show real data and the pay buttons work against real records.
- Add matching past payment records so dashboards show history.
- Delivered as a database migration so it is repeatable.

## 4. Promoted ideas and partner comments
- When a submission is promoted, the new idea appears at the top of the Innovation Lab ideas list with a "From submission" badge and link back to the source.
- New idea comments: anyone in the Innovation Lab (members, division admins, linked partners) can read and post; authors can delete their own.
- Comment thread on each idea card/detail with count shown in the list.

## Technical details
- GSC via standard connector, META verification on the root route head, sitemap PUT to the exact verified property.
- New table `idea_comments` (idea_id, author_id, body, created_at) with grants, RLS scoped by Innovation Lab membership/division admin; add `source_submission_id` to `ideas`.
- Seed via migration with fixed UUIDs and `on conflict do nothing`; link to your account by email lookup.
- Verify with a Playwright pass: landing buttons, tenant/investor dashboards, promote then comment.

## Open question
- Partners currently have no login of their own. Comments will come from Innovation Lab members acting for a partner (with partner name shown) unless you want separate partner logins, which is a larger build.
