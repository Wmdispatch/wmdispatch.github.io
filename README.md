# Ayn Fleet

Offline vehicle and equipment inspection app (Progressive Web App).

- Open the site once with internet; after that it works with no network.
- No fleet data is stored in this repository. Each phone loads the master file in Settings, Fleet data, and the list stays on that phone only.
- Reports, drafts and photos are saved on the phone.

## Updating the app
Replace `index.html` (and `sw.js` when its cache name changes) in this repository. GitHub Pages publishes within a minute or two, and phones show an Update button the next time they open the app online.

## Dashboards
- `dashboard.html`: HSE dashboard (needs the ADMIN code from your own Apps Script server).
- `workshop.html`: workshop jobs (needs the WORKSHOP code).
Codes are pasted once per browser and kept there. No data or codes are stored in this repository.
