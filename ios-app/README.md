# ADROS iPhone app (.ipa for the App Store)

Like the Android app, the iPhone app is a small "wrapper" (Capacitor) that opens the live web app
https://bro0o2a.github.io/Family_Planner/ full screen. Normal app changes go live by themselves:
no new .ipa is needed. Make a new .ipa only when Apple asks, or the name/icon changes.

- `capacitor.config.json` — app id `com.adros.app` (never change it after the first upload), name, the live site address.
- `icon-1024.png` — the App Store icon: 1024 × 1024 PNG, square corners, nothing see-through.
- `make-project.sh` — turns it into an Xcode project. GitHub runs it on a Mac; you don't need a Mac.
- Build: GitHub → Actions → **iPhone app** → **Run workflow** → type the build number (+1 every upload).

## Signing (needs the Apple Developer account, $99 a year)
Without these 4 repository secrets the build still runs, but gives `ADROS-unsigned.ipa`
(only a check that it builds; Apple and iPhones won't accept it).
Settings → Secrets and variables → Actions → New repository secret:

| Secret | Where it comes from |
|---|---|
| `APPLE_TEAM_ID` | developer.apple.com → Account → Membership details → Team ID (10 letters/numbers) |
| `ASC_KEY_ID` | App Store Connect → Users and Access → Integrations → App Store Connect API → **Generate API Key** (Access: **Admin**) → Key ID |
| `ASC_ISSUER_ID` | same page, "Issuer ID" at the top |
| `ASC_KEY_P8` | the `AuthKey_XXXX.p8` file you download once from that page: open it in Notepad, copy **everything** |

Before the first upload also make the app once in App Store Connect → Apps → **+** → New App
(iOS, name ADROS, bundle ID com.adros.app, SKU adros).
With the secrets the build makes a signed `ADROS.ipa`, and if you tick "Send to App Store Connect"
it uploads it there too (then it shows in TestFlight after Apple processes it, about 15-30 min).
