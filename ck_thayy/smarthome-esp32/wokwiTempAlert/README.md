# Wokwi ESP32 temperature alert

This project reads a DHT22, publishes temperature/humidity JSON to the public
HiveMQ MQTT broker, and posts an alert to the SmartHome API when the
temperature reaches 35 C.

## Run it in Wokwi

1. Open [Wokwi ESP32 project](https://wokwi.com/projects/new/esp32).
2. Replace the starter sketch with `sketch.ino`, then add `diagram.json` and
   `libraries.txt` to the project.
3. In `sketch.ino`, set `API_URL` to the public HTTPS address of the deployed
   API, and set `DEVICE_TOKEN` to the same value as the server's
   `IOT_DEVICE_TOKEN`.
4. If push notifications should target one home, set `HOME_ID` to that home ID.
   Leave the `replace-...` value while testing without Firebase.
5. Start the simulation. The DHT22 temperature control is in the simulated
   component. Raise it to 35 C or more and check the serial monitor.
6. Confirm the MQTT message on `smarthome/wokwi-esp32-dht22/temperature` with
   an MQTT client, and check the alert in the web dashboard.

Wokwi must reach a public HTTPS API; it cannot reach `localhost` on your PC.
The sketch uses `setInsecure()` only to make the Wokwi HTTPS test work before a
certificate is configured. Do not copy that setting to a physical device;
install the service's CA certificate with `setCACert()` before real deployment.
The HiveMQ broker is public, so do not publish personal data or production
credentials in MQTT payloads.
