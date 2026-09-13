# MANGANAI Frontend

React/Vite dashboard for the MANGANAI intelligence platform.

## Firebase Authentication

Authentication uses Firebase Email/Password Authentication. Enable that provider in the Firebase console, create users there, and copy the web app configuration into a local `frontend/.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

The dashboard routes require a signed-in Firebase user. Unauthenticated users are sent to `/login`, and the header provides sign-out.

For Vercel deployments, add the same six variables under **Project Settings → Environment Variables** for Preview and Production, then redeploy. If they are missing, the deployment shows a configuration message on `/login` instead of a blank screen.

## Development

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` and `/health` to the FastAPI backend at `http://127.0.0.1:8000`.
