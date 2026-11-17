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


## Revision after Final feedback

Real photos have documented Wikimedia Commons author and license attribution in PHOTO_CREDITS.md, CREDITS.txt and credits.html. Photos are remote and need a connection, with SVG fallback. Locations without licensed authentic venue photography have clearly labeled representative images. Switch Day/Night to see separate photos on Botanical Garden and Baiterek. Day mode has a cleaner sage/white palette and an actual daytime photograph for the hero.

Suggest now saves private user places (including optional address, duration and photo) into your local Explore and Plan catalogs. Uploaded JPG/PNG/WebP photos (maximum 8 MB) are center-cropped to a consistent 960×608 rectangle and compressed into JPEG before localStorage saving. Only the five newest private places are kept per account; very large photos that cannot fit the browser quota will be refused with a message. A public moderation workflow would require a backend.

Plan includes Saved only and My places filters plus sorting by name, price, or duration. Existing demo Sign Up / Log In / Profile remains; do NOT reuse your real-world password on this demo. This is not server-side authentication.

Before the defense, test at widths 375px, 768px and 1280px in both themes; open the site with Live Server or another HTTP server (not file://); check external photos with an internet connection.

If a guest creates places before signing up, guest suggestions, favorites and plans are merged into the newly created demo account on sign-in; the site remains local-only. When offline, a custom daytime SVG illustrates the hero until the licensed photo is available.

## Existing team repository and publication

- Original repository: https://github.com/orlkhn/Adilzhan_Yerkhan_WEB_endterm
- Previous GitHub Pages deployment: https://orlkhn.github.io/Adilzhan_Yerkhan_WEB_endterm/
- This revised ZIP has not been uploaded or deployed to GitHub by the assistant. Review, commit with both team members, and test live photos after deployment; do not make commits past the instructor's deadline.
- The project is front-end only. Night Pass uses **demonstration** credentials stored in the visitor's own browser; never enter a real password.
