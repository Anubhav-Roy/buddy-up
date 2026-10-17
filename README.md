# buddyup

Find a verified local to show you around a city, or a fellow traveller (buddy) to explore with.

## Run

    node server.js
    # open http://localhost:5173

## Firebase setup

buddyup stores its data in Firebase on the free **Spark** plan: **Authentication** (email/password + Google) and **Cloud Firestore** (profiles, trips, availability, meetups, chat, reviews, reports). Profile photos go to **Cloudflare R2** through a small Worker (below); local ID/selfie photos are compressed and saved in a write-only Firestore document. Your project details go in `firebase-config.js`.

1. **Authentication → Sign-in method**: enable **Email/Password** and **Google** (how people log in), and **Phone** — used only to text a one-time code that verifies a local's number, never as a way to log in (the temporary phone user Firebase creates is deleted right after). Real SMS needs the paid **Blaze** plan; on the free plan add test numbers with fixed codes under *Phone numbers for testing*.
2. **Firestore Database → Create database** (production mode, pick a region near your users). Then **Rules** → paste `firestore.rules` → **Publish**.
3. **Authentication → Settings → Authorized domains**: `localhost` is there by default; add your real domain when you host the site.
4. Restrict the browser API key to your domains: Google Cloud console → APIs & Services → Credentials.
5. Run `node server.js` and open http://localhost:5173. buddyup doesn't work when `index.html` is opened directly as a file.

## Profile photos (Cloudflare R2)

Travellers must add a photo (picked or taken with the camera) before they can use buddyup. The browser shrinks it to ≤ 1024 px / ≤ 500 KB JPEG (and strips location data); originals over 10 MB are refused. The Worker in `worker/` accepts up to 600 KB (500 KB + 20% headroom), stores one photo per user in a **private** R2 bucket and serves it only to signed-in users — every request must carry a valid Firebase ID token.

1. Cloudflare dashboard → **R2** → create a bucket named `buddyup-photos`. Leave **Public access** off.
2. From `worker/`: `npx wrangler login`, then `npx wrangler deploy`. `wrangler.toml` routes `buddyup.fyi/api/photo` and `buddyup.fyi/photos/*` to the Worker (the domain must be on Cloudflare, which it is if you bought it there) and sets `FIREBASE_PROJECT_ID` and the allowed origins.
3. Check the gate: `curl -i https://buddyup.fyi/photos/x` must return **401** with a `WWW-Authenticate` header.
4. `BUDDY_PHOTO_API` in `firebase-config.js` must be `https://buddyup.fyi` — it has to match the photo URL pattern in `firestore.rules`.
5. Add `buddyup.fyi` (and `www.buddyup.fyi` if used) under Firebase → Authentication → Settings → Authorized domains.

**Approving locals:** locals can't approve themselves (the rules block it). A reviewer opens Firestore → `users` → the local's document, checks their answers in `private/info` and their ID/selfie in `users/<uid>/verification/id` and `/selfie` (the `image` field is a photo you can paste into a browser tab), then sets `approved` to `true`. The local's dashboard updates live.

**Where data lives**

| Path | Contents | Who can read |
|---|---|---|
| `users/{uid}` | name, photo URL (R2), bio, cancellations count, interests, mode, home city, trip + free times, availability, `approved` | any signed-in user |
| `users/{uid}/private/info` | email, phone, birthdate, verification answers, postcode | only that user |
| `meetups/{id}` | requests between two users, status, time slot | the two participants |
| `chats/{uidA_uidB}` + `/messages` | conversations | the two participants |
| `reviews/{meetupId_uid}` | ratings & reviews after completed meetups | any signed-in user |
| `users/{uid}/verification/{id,selfie}` | compressed ID & selfie photos | nobody in the app (review in console) |
| `reports/{id}` | safety reports | nobody in the app (review in console) |
| R2 `profiles/{uid}/{id}.jpg` | profile photo | any signed-in user (checked by the Worker) |

Rules also enforce: requests at least ~a day ahead, only the recipient can accept/decline, meetups complete only after their time has passed, one review per person per completed meetup, no messages once either person has blocked the other, and cancelling a confirmed meetup adds one to the canceller's `cancellations` count (which can never go down; people with more cancellations appear lower in search).

`node build.js` still produces a single-file `dist/buddy.html`, but it only works when hosted on an authorised domain.

## What's in the app

- Landing page (hero, how it works, safety, for locals) with sign up / log in and Traveller / Local choice
- **Traveller ⇄ Local**: everyone can switch modes from the header; a traveller can "Become a local" (starts verification), a local can switch to traveller any time
- **Date of birth**: asked at sign-up (accounts made earlier are asked once); kept in `private/info`, and only the age is public and shown on people's cards and profiles. All dates are shown and typed as dd/mm/yyyy
- **Profile photo**: travellers add a photo (upload or live camera selfie) before anything else — "we need an image to establish credibility"
- **Discover (travellers)**: destination (with city suggestions), dates and a month calendar of the date/time ranges they're free → **Find people** → locals and buddies together, tagged Local / Buddy, with filters for type, day, interest, language and 4★+ rating
- **Every traveller is a buddy**: the trip times a traveller enters to search are also when other travellers in that city can find them (minus times they already have a confirmed meetup). They never see themselves
- **Local verification** (4 steps): residency (min. 6 months), neighbourhood + postcode — cross-checked with OpenStreetMap and flagged for review if they don't match — languages (incl. "Other" with custom entry), local-knowledge questions, phone OTP via Firebase + ID/selfie stored privately in Firestore, safety pledge → trust score
- **Results**: only people free for at least an hour at the same date/time, starting at least 24h ahead; cards show matching times and ratings; requests pick a shared time and get a local- or buddy-specific suggested first message
- **Local availability**: once approved, locals must add date/time ranges on a month calendar for the next 5 weeks (at least one time in the next 4 weeks) before getting requests, and are prompted to extend it when it drops below 30 days
- **Local dashboard**: in review → timeline, trust score, review flags, approval by a reviewer in the Firebase console; approved → meetup requests only in the local's free slots (accept & chat / decline / view profile), upcoming meetups, availability summary, travellers-in-town count. Locals don't browse travellers — travellers reach out
- **Meetups & reviews**: Meetups page (requests / upcoming / waiting / past — every completed meetup, with a review button until you've reviewed it — / cancelled); either side can cancel with a reason, after a warning that cancelling a confirmed meetup is recorded and lowers them in search; after a meetup's time ends, both sides rate 1–5 stars and write a review; ratings and reviews show on every profile, card and request
- **Messages** (two-pane): live chat between real users (Firestore), unread badges, quick replies, report / block / share-meetup menu
- **Contact us** page (`#/contact`, linked from the landing page, footer, Safety and Profile) with contact@buddyup.fyi
- **Safety** guidelines page and **Profile** page (modes, trust score, settings, permanent account deletion — profile, photo, private details, ID/selfie and sign-in are deleted; upcoming meetups are cancelled; reviews they wrote are signed "Former member")

## Not done yet

- Approving locals is done by hand in the Firebase console — an admin screen and email notifications would come next.
- Push notifications and server-side checks (e.g. Cloud Functions to re-verify phone numbers and compute trust scores) aren't built yet.
- The postcode check calls OpenStreetMap Nominatim from the browser; production should do it server-side with a commercial geocoder.
