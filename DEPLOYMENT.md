# Deployment Guide

## GitHub Pages Deployment

This project is configured to deploy automatically to GitHub Pages.

### Setup GitHub Secrets

Before deployment, add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name | Value |
|------------|-------|
| `FIREBASE_API_KEY` | Your Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `FIREBASE_DATABASE_URL` | `https://your-project-default-rtdb.firebaseio.com/` |
| `FIREBASE_PROJECT_ID` | Your project ID |
| `FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID |
| `FIREBASE_APP_ID` | Your Firebase app ID |

### Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### Deploy

The site will automatically deploy when you push to the `master` branch (or configured branch).

Manual deployment: Go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**

### Live URL

After deployment completes:
**https://alenros.github.io/obviously-static/**

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials
3. Run `pnpm dev`

## Important Notes

- Firebase credentials are stored as GitHub Secrets (never commit `.env`)
- The API key is public-facing (normal for client-side apps)
- Secure your Firebase with proper security rules!
- Run `pnpm cleanup:firebase` periodically to remove old rooms
