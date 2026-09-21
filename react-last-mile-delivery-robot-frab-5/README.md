# Last Mile Delivery Educational Robot App

React web app for the FRAB5 educational robot. The frontend uses Vite and Firebase Realtime Database.

## Requirements

- Node.js 20.19 or newer
- npm

## Commands

```sh
npm ci
npm start       # development server at http://localhost:5173
npm test        # run tests once
npm run build   # production files in dist/
```

Firebase Hosting serves `dist/`. Run `npm run build` before deploying.

## Firebase room reliability

Room creation, joining, game updates, and leaving wait for a Firebase server acknowledgment. A room or player appears in the UI only after its write succeeds. The host and each player register a server-side `onDisconnect` removal so an unexpected tab close or network loss clears their session data. Once a live room loses its Firebase connection, the app ends that session and requires a page reload; this prevents queued offline writes from recreating a removed room.

The local Realtime Database integration check can be run with Firebase CLI and Java 21 or newer:

```sh
firebase emulators:exec --config firebase.emulator.json --project demo-frab5 --only database "node test/firebaseEmulatorCheck.mjs"
```

`firebase.emulator.json` and `test/firebase-emulator.rules.json` are for the demo emulator only. Do not deploy those permissive rules to production. As observed on 2026-09-21, the production Realtime Database instance is disabled and its stored rules allow public reads and writes. Live sessions will remain unavailable until the instance is enabled with an appropriate authenticated access design and rules.

## Dependency security

Run `npm audit` to check the complete dependency tree. `exceljs@4.4.0` still requests `uuid@8`; the package override selects the patched `uuid@11.1.1` instead. ExcelJS uses the compatible CommonJS `v4()` API for conditional formatting. The Excel export test covers this integration until ExcelJS updates its own dependency.
