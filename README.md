# NightShift — Final project (Web Technologies 1, Front End)

A guide to 15 real places in Astana: browse places, build a night plan, suggest a spot,
and keep everything on your own Night Pass profile. No backend: all data is in localStorage.

## Pages
| Page | File | What it does |
|---|---|---|
| Home | index.html | mood picker, random pick, FAQ accordion, Night Pass call-to-action |
| Explore | explore.html | search, filters, sort, favourites (♡) and a Saved filter |
| Plan | compare.html | validated planner form, live total / duration / timeline, save plan |
| Suggest | suggest.html | validated form, saved ideas list |
| Log in / Sign up | login.html, signup.html | demo accounts with validation |
| Profile | profile.html | Night Pass, saved places and plans, counters, settings |
| Credits | credits.html | sources and AI assistance |

## Code map
- `css/style.css` — base design, all colours are CSS variables (dark + light tokens at the top)
- `css/components.css` — sticky header, theme toggle, toasts, account and profile pages
- `js/common.js` — storage helpers, toasts, form helpers, menu, FAQ (jQuery)
- `js/theme.js` — light/dark toggle saved in localStorage (`ns-theme`)
- `js/auth.js` — accounts (`ns-users`, `ns-session`), navigation changes for logged-in users
- `js/data.js` — the 15 real Astana places (prices approximate); Wikimedia Commons photograph URLs plus local SVG fallbacks; one JS file per page for page logic

## localStorage keys
`ns-theme`, `ns-users`, `ns-session`, and per account `ns:<email|guest>:favorites | plans | suggestions | draft` (all JSON).

Demo only: do not use a real password.


## Final features

- 15 named Astana places with price and duration estimates, ten bundled team-provided images/logos and five externally linked Wikimedia Commons images (SVG fallback included).
- Day/Night themes via CSS variables with a persistent, keyboard-accessible toggle. The same local Baiterek image is used on the Home hero in both themes.
- Home: mood choices, Surprise Me and a seamless repeating ticker; decorative rings are centered on a common axis.
- Explore: live search, categories, budget filter, sorting, favorites and personal places.
- Plan: three-stop itinerary, Saved only and My places filters, optional replacement dialog, calculated cost/timeline and saved plans.
- Suggest: validated form, private user places, optional address, duration and image upload. JPG/PNG/WebP uploads (up to 8 MB) are cropped to 960×608, compressed and stored locally. The five latest user places are retained.
- Night Pass: demonstration Sign Up, Log In, Profile and Log Out with per-user saved data. Data stays in this browser; real passwords should not be used.

## Sources and licensing

See `CREDITS.txt`, `PHOTO_CREDITS.md` and `credits.html` for Bootstrap, jQuery, SVG artwork, AI development assistance and photo/brand image provenance. Images from the web or social media are not automatically licensed for reuse merely because they are publicly accessible.

## Project URLs

- Repository: https://github.com/orlkhn/Adilzhan_Yerkhan_WEB_Final
- Deployed website: https://orlkhn.github.io/Adilzhan_Yerkhan_WEB_Final/
- NightShift is a static front-end project without server-side sign-in, booking or payments.
