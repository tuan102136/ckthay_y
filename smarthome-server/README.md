# SmartHome API

The API accepts ESP32 alerts, stores a short in-memory feed for the web test
dashboard, and sends Firebase Cloud Messaging pushes to app devices registered
for the same Firebase home.

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `.env` before running:

- Keep `FIREBASE_PROJECT_ID=cktuan-1455f` for the Firebase project you provided.
- Replace `FIREBASE_DATABASE_URL` with the Realtime Database URL shown in
  Firebase Console > Realtime Database.
- Create a random `IOT_DEVICE_TOKEN`; use the same value in the ESP32 sketch.
- For local API tests, Firebase Admin credentials may stay unset. The health
  endpoint then reports that push is not configured.

Check `http://localhost:3001/api/health`. For a simulated web alert, open the
web project on port 5173 and use **Gửi cảnh báo thử**. The production API does
not expose that development-only endpoint.

To test the protected device endpoint locally:

```powershell
$body = '{"deviceId":"wokwi-esp32","type":"temperature","value":39.5,"threshold":35}'
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/iot/alert `
  -Headers @{'X-Device-Token'='your-IOT_DEVICE_TOKEN'} `
  -ContentType 'application/json' -Body $body
```

## Firebase values needed by the server

The Android `google-services.json` is a client config; it is not an Admin key.
To enable real pushes:

1. Open [your Firebase project](https://console.firebase.google.com/project/cktuan-1455f/overview),
   enable Email/Password sign-in and Firebase Cloud Messaging, and create a
   Realtime Database if it does not exist.
2. Open Project settings > Service accounts and generate a Firebase Admin
   private key. Save it as `serviceAccountKey.json` beside this README for local
   testing. This file is ignored by Git; never commit or send it in chat.
3. Put the Realtime Database URL in `FIREBASE_DATABASE_URL` and the downloaded
   key path in `FIREBASE_SERVICE_ACCOUNT_PATH`.
4. Add Firebase Messaging to the React Native app and register its Android
   application (`com.smarthome`) in this same Firebase project. Download the
   new `google-services.json` and replace the old file in
   `smarthome-app/android/app/`.
5. Register the Firebase ID token and notification token from the app. The API
   stores tokens through the Admin SDK and filters pushes by `homeId`.
6. Review `database.rules.json` before deploying it. The existing device rule
   currently allows unauthenticated writes for the legacy ESP32 workflow; do
   not deploy that rule to a production database until device authentication
   has been restricted.

For Render, create a Node Web Service with `smarthome-server` as the root
directory, `npm install` as the build command, and `npm start` as the start
command. Set `NODE_ENV=production`, `FIREBASE_PROJECT_ID`,
`FIREBASE_DATABASE_URL`, `IOT_DEVICE_TOKEN`, and `WEB_ORIGIN` in the Render
dashboard. Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete downloaded
service-account JSON as a protected secret; do not set a local file path on
Render. Use Render's generated HTTPS URL in the Wokwi sketch and mobile API
configuration. A cloud URL cannot be created from this workspace without your
Render account and deployment permission.
