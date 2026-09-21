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

## Dependency security

Run `npm audit` to check the complete dependency tree. `exceljs@4.4.0` still requests `uuid@8`; the package override selects the patched `uuid@11.1.1` instead. ExcelJS uses the compatible CommonJS `v4()` API for conditional formatting. The Excel export test covers this integration until ExcelJS updates its own dependency.
