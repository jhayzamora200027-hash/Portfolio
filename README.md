# Firebase Portfolio

This repository contains a simple, beautiful portfolio site intended for static hosting (Firebase Hosting, Netlify, GitHub Pages, etc.).

Files of interest

- `public/index.html` — the portfolio landing page
- `public/styles.css` — styling and responsive layout
- `public/app.js` — small UI interactions (nav, theme, contact)
- `firebase.json` — hosting configuration

Preview locally

1. Open `public/index.html` directly in your browser (quickest):

```bash
# on Windows from repository root
start public\index.html
```

2. Or use a simple static server (recommended):

```bash
# with npm's http-server (install if needed)
npm install -g http-server
http-server public -c-1
```

3. To preview with Firebase CLI:

```bash
npm install -g firebase-tools
firebase serve --only hosting
```

Deploy to Firebase Hosting

1. Install and login:

```bash
npm install -g firebase-tools
firebase login
```

2. Initialize (if you haven't):

```bash
firebase init hosting
```

3. Deploy:

```bash
firebase deploy --only hosting
```

Want changes? Tell me which colors, fonts, or sections to add and I'll update the design.
