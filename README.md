# Orbit — Starter Project

Orbit is a modern goal and project management app. This repository is the **initial UI foundation**: responsive dashboard shell, sidebar navigation, top bar, and sample dashboard content.

> This is a frontend starter. Login, cloud database, real goal/task persistence, and deployment are **not implemented yet**.

## Requirements
- Node.js 20 or newer
- npm

## Run locally
1. Download and unzip this project.
2. Open a terminal inside the `orbit-starter` folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Build check
```bash
npm run build
```

## Upload to GitHub (easy method)
1. Sign in to GitHub and create a new **empty repository** named `orbit`.
2. Keep it public or private as you prefer. Do not add a README or license during repository creation, because this folder already has a README.
3. On the new repository page, choose **Add file → Upload files**.
4. Upload the *contents* of the unzipped `orbit-starter` folder (including `app`, `components`, and hidden files such as `.gitignore` if the upload interface allows them).
5. Commit the upload.

For ongoing updates, Git is more convenient than re-uploading files, but it is optional for this first upload.

## Important
- Do not upload `.env` files, passwords, API keys, or other secrets.
- `.env.example` is a safe template and contains no real credentials.
- Dashboard numbers and sample cards are demonstration UI only, not stored user data.
- The app currently uses browser-side UI state only; refresh-safe storage and user accounts will be added later.
