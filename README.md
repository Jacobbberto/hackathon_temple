# PhillyPulse (working name)

**Everything happening in Philly today, in one place.**

Built for **OwlHacks 2026 — Philly Special track**.

---

<p align="center">
  <img src="docs/screenshots/home.png" width="200" alt="Home tab at sunset" />
  <img src="docs/screenshots/events.png" width="200" alt="Events tab" />
  <img src="docs/screenshots/sports.png" width="200" alt="Sports tab" />
  <img src="docs/screenshots/politics.png" width="200" alt="Politics tab" />
</p>

## The Problem

Staying on top of what's happening in Philadelphia means checking a lot of places. Local news is spread across several outlets. Game times and scores live in separate team and league apps. Weather is its own app. Parades, races, and festivals, along with the street closures they bring, are listed on city pages, tourism sites, and ticketing platforms. Local government information sits on City Council's legislative portal, state legislature sites, and election office pages that most people never visit.

The result is that residents miss things that affect their day:

- **Getting caught off guard.** A half-marathon closes your usual route, or a parade shuts down Broad Street, and you find out when you're already stuck in it.
- **Missing the moment.** The Phillies are in a tight game or the Eagles kick off in an hour, and you didn't know until it was over.
- **Being left out of local decisions.** City Council hearings and local bills shape daily life in Philadelphia (housing, transit, taxes, public safety), but they get little attention, and election deadlines slip by unnoticed.
- **Newcomers have it hardest.** Students, new residents, and visitors don't yet know which sources to trust or where to look.

No single place answers the simple question: **"What's going on in Philly right now?"**

## The Solution

PhillyPulse is a mobile and web app that acts as **Philadelphia's daily dashboard**. It brings together local news, events, sports, weather, and civic information in one glanceable app with four tabs: **Home, Events, Sports, and Politics**.

Open it in the morning and within seconds you know the weather, which Philly teams play today, the top local headlines, and anything this week that might close your street or be worth showing up for.

### Guiding principles

- **Local first.** Everything is filtered for Philadelphia. No national noise.
- **Glanceable.** The Home screen answers "what do I need to know today?" in under 10 seconds. Detail lives one tap deeper.
- **Always fresh.** Data refreshes automatically: live scores every minute, weather every 30 minutes, news and events throughout the day.
- **Respect the source.** News items show headlines and short snippets, then link to the original outlet. We point readers to local journalism rather than replace it.
- **Civic, not partisan.** The Politics tab uses official sources and neutral plain-language summaries. No endorsements, no opinion content.

### Who it's for

- Philadelphia residents who want one app instead of five
- Students (Temple and beyond), including those new to the city
- Commuters who need to know about closures and big events
- Anyone who wants to follow local government without digging through official portals

---

## How It Works

The app never calls outside data sources directly. A lightweight backend collects data from news feeds, sports scoreboards, weather services, event listings, and government APIs on a schedule. It cleans and caches that data, then serves it to the app through four simple endpoints, one per tab.

```mermaid
flowchart LR
    A[News RSS feeds] --> B
    C[Sports scoreboards] --> B
    D[Weather API] --> B
    E[Event listings] --> B
    F[Council & legislature APIs] --> B
    B[Aggregator backend<br/>fetch · normalize · cache] --> G[/home /events /sports /politics/]
    G --> H[Expo app<br/>iOS · Android · Web]
```

This keeps the app fast, keeps API keys off users' devices, avoids browser CORS restrictions on the web version, and means one slow or failing source never breaks the whole app.

---

## MVP

### App shell
- [x] Bottom tab navigation: Home, Events, Sports, Politics
- [x] Pull-to-refresh on every screen
- [x] Runs on iOS, Android, and web from one codebase

### Home
- [x] Weather card: current conditions, today's high and low, 3-day outlook
- [x] "Today in Philly" sports strip showing any Philly team playing today, with a pulsing **LIVE** badge for games in progress
- [x] Top 5–8 local headlines from the last 24 hours, each linking to the original article
- [x] "This week" preview of the next 3 upcoming events

### Events
- [x] This week's events, grouped by day
- [x] Filters: Parades & Festivals, Races & Runs, Civic/Political, Concerts & Shows
- [x] Each event shows date, time, location, link, and any street-closure notes

### Sports
- [x] Three views: **Live**, **Upcoming**, **Recent**
- [x] Teams: Eagles, Phillies, Sixers, Flyers, Union, Temple Owls
- [x] Live games show the score and game clock or inning, auto-refreshing while open
- [x] "Where to watch" shows the official broadcaster and links to its app or site
- [x] Recent games show final scores and a link to the recap

### Politics
- [x] Upcoming election countdown with key dates (registration and mail-ballot deadlines) and a link to the official polling place lookup
- [x] This week's City Council hearings and sessions
- [x] Recently introduced or passed bills, each with a one-sentence plain-language summary and a link to the official text

### Out of scope for the MVP (stretch goals)
- Saved favorite teams
- Push notifications when a favorite team's game starts
- "Find your reps" lookup by address
- AI-generated "Philly in 60 seconds" daily digest
- User accounts

---

## Philly Flavor

The data is serious; the app doesn't have to be. Everything below is built in (no image assets, all SVG and code):

- **A living skyline.** The Home header is an illustrated view from the Schuylkill: rowhomes with colored doors, the LOVE statue, traffic cones, City Hall with Billy Penn on top, One & Two Liberty, the Comcast towers, and Boathouse Row. The sky follows Philly time (dawn, day, sunset, night), windows light up after dark, and Boathouse Row's outline lights twinkle.
- **Dress up Billy Penn.** Tap the statue on City Hall to put him in each team's jersey, the way the city does during playoff runs. Keep tapping for a nod to the Curse of Billy Penn.
- **Stadium chants.** The **GO BIRDS** button spells out E! A! G! L! E! S! full screen, then drops confetti in midnight green. Every team pennant on the Sports tab has its own chant (Ring the Bell, Trust the Process, DOOP...).
- **Weather in the local dialect,** plus a scientifically calibrated **Wooder Ice Index**.
- **Jawn of the Day:** a flip card that teaches one piece of Philly slang a day (jawn, wooder, jimmies, drawlin', SKOO-kul...).
- **Ring the Liberty Bell** on the Politics tab to see the election countdown. Don't ring it too hard.
- **Run the Rocky Steps.** When a filter comes up empty, tap your way up all 72 steps.
- **Hazard-stripe closure notes,** a bouncing cheesesteak loader, and a backend that "went down the shore" when it's unreachable.

Colors come from the city flag (azure and gold), with each team's colors used wherever that team shows up.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile & web app | React Native + Expo, TypeScript, Expo Router |
| Data fetching | TanStack Query (caching, auto-refresh) |
| Backend | Python + FastAPI |
| Scheduling | APScheduler (or cron via GitHub Actions / Cloud Scheduler) |
| Cache / storage | SQLite or Redis |
| Hosting | Backend container on Google Cloud Run or Render; web build on Netlify or Vercel |
| CI/CD | GitHub Actions: type-check, lint, test, build and deploy on push to `main` |

## Data Sources

| Section | Source |
|---|---|
| Weather | Open-Meteo / National Weather Service API |
| News | RSS feeds from Philadelphia news outlets |
| Sports | Public scoreboard data (schedules, live scores, broadcasters) |
| Events | Ticketmaster Discovery API plus a curated list of city events (parades, races, festivals) |
| Politics | Philadelphia City Council legislative data (Legistar), Open States (PA General Assembly), official election pages |

---

## Getting Started

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add API keys (all optional)
uvicorn main:app --reload
```

The API runs at http://localhost:8000 with interactive docs at `/docs`. Endpoints: `/home`, `/events`, `/sports`, `/politics`.

No keys are required. Weather (Open-Meteo), news (outlet RSS feeds), sports (ESPN's public scoreboard) and City Council (Legistar) are all keyless. Two sources are optional:

| Variable | Adds |
|---|---|
| `TICKETMASTER_API_KEY` | Concerts & shows on the Events tab |
| `OPENSTATES_API_KEY` | PA General Assembly bills on the Politics tab |
| `PULSE_OFFLINE=1` | Demo mode: no network calls, sample data everywhere (handy for pitching on bad Wi-Fi) |

If a source is down, the API serves its last good copy; if it has never answered, it serves clearly labeled sample data. Either way the app shows a small **Demo data** / **Saved data** badge so nobody mistakes it for live info.

Run the tests with `pip install -r requirements-dev.txt && pytest`.

### App
```bash
cd app
npm install
npx expo start         # press w for web, or scan the QR code with Expo Go
```

In development the app finds the backend on the same machine as the Expo dev server (port 8000), so Expo Go on a phone works as long as both are on the same Wi-Fi. For deployed builds set `EXPO_PUBLIC_API_URL`, e.g. `EXPO_PUBLIC_API_URL=https://phillypulse-api.example.com npx expo export --platform web`.

Checks: `npm run typecheck` and `npm run lint`.

### Deploying
- **Backend:** `backend/Dockerfile` runs on Cloud Run or Render as-is (it listens on `$PORT`).
- **Web app:** `npx expo export --platform web` writes a static site to `app/dist` for Netlify or Vercel (configure a single-page-app fallback to `index.html`).
- **CI:** `.github/workflows/ci.yml` runs the backend tests plus the app's type-check, lint and web build on every push and pull request.

### Project layout
```
backend/
  main.py                 FastAPI app, scheduler, the four endpoints
  pulse/feeds.py          fetch -> cache -> fallback machinery
  pulse/sources/          weather, news, sports, events, politics fetchers
  pulse/summarize.py      plain-language bill summaries
  pulse/elections.py      PA election calendar rules
  data/curated_events.json  Mummers, Broad Street Run, Marathon... as recurrence rules
app/
  src/app/                Expo Router screens: index (Home), events, sports, politics
  src/components/         Skyline, chants/confetti, cards, custom tab bar
  src/constants/philly.ts slang, chants, weather takes
```

---

## Team

- Name — role
- Name — role
- Name — role
