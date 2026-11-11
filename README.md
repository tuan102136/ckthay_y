# SmartHome

Smart-home demo using an ESP32, Firebase Realtime Database/Cloud Messaging,
React Native, and a web dashboard for testing alerts.

## Projects

- `smarthome-esp32/wokwiTempAlert`: Wokwi ESP32 + DHT22 sketch; sends MQTT
  telemetry and HTTP alerts.
- `smarthome-server`: Node API, device-token registration, and Firebase push
  notifications.
- `smarthome-app`: existing React Native Android/iOS application.
- `smarthome-web`: local dashboard for backend status and test alerts.

## Local test

1. Start the API: in `smarthome-server`, copy `.env.example` to `.env`, set
   `IOT_DEVICE_TOKEN`, then run `npm install` and `npm run dev`.
2. Start the web dashboard: in `smarthome-web`, run `npm run dev`.
3. Open `http://localhost:5173`, sign in to the demo, and send a test alert.
4. The dashboard should show the API as online and the test alert in its feed.

Firebase project alias is set to `cktuan-1455f`. The existing Android client
config belongs to a different Firebase project and must be replaced with a
downloaded config from the project above before mobile push notifications work.
See `smarthome-server/README.md` for the exact Firebase setup and deployment
steps. Do not commit Firebase Admin service-account keys.
