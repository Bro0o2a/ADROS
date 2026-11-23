# ADROS Android app (.aab for Google Play / Galaxy Store)

The Android app is a small "wrapper" (Trusted Web Activity) that opens the live web app
https://bro0o2a.github.io/Family_Planner/ full screen. Normal app changes go live by themselves:
no new .aab is needed. Make a new .aab only when the store asks, or the name/icon changes.

- `twa-manifest.json` — app id `com.adros.app` (never change it after the first store upload), name, colours, version.
- `make-project.mjs` — turns it into an Android project (Bubblewrap). GitHub runs it; you don't need to.
- Build: GitHub → Actions → **Android app** → **Run workflow** → type the version code (+1 every upload).
  The files are on the run's page (Artifacts) and in a draft Release.
