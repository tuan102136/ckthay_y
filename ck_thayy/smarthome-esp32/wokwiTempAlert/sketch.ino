#include <ArduinoJson.h>
#include <DHTesp.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *WIFI_SSID = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";
const char *MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;
const char *API_URL =
    "https://YOUR_RENDER_SERVICE_URL/api/iot/alert";
const char *DEVICE_TOKEN = "replace-with-the-same-IOT_DEVICE_TOKEN";
const char *DEVICE_ID = "wokwi-esp32-dht22";
const char *HOME_ID = "replace-with-firebase-home-id";

const int DHT_PIN = 15;
const int ALERT_LED_PIN = 2;
const float TEMPERATURE_THRESHOLD_C = 35.0;
const float RESET_THRESHOLD_C = 33.0;
const unsigned long SAMPLE_INTERVAL_MS = 5000;

WiFiClient mqttNetwork;
WiFiClientSecure httpsNetwork;
PubSubClient mqttClient(mqttNetwork);
DHTesp dht;
unsigned long lastSampleAt = 0;
bool alertPosted = false;

String mqttTopic() {
  return String("smarthome/") + DEVICE_ID + "/temperature";
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
  Serial.print("Connecting to Wokwi WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected: ");
  Serial.println(WiFi.localIP());
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    String clientId = String(DEVICE_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    Serial.print("Connecting to MQTT...");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

void publishTemperature(float temperature, float humidity) {
  StaticJsonDocument<192> document;
  document["deviceId"] = DEVICE_ID;
  document["type"] = "temperature";
  document["value"] = temperature;
  document["unit"] = "C";
  document["humidity"] = humidity;
  document["timestamp"] = millis();

  char payload[192];
  const size_t payloadLength = serializeJson(document, payload, sizeof(payload));
  const bool published =
      mqttClient.publish(mqttTopic().c_str(), payload, payloadLength);

  Serial.println(published ? "MQTT publish OK" : "MQTT publish failed");
  Serial.println(payload);
}

bool postTemperatureAlert(float temperature) {
  if (String(API_URL).indexOf("YOUR_RENDER_SERVICE_URL") >= 0 ||
      String(DEVICE_TOKEN).startsWith("replace-")) {
    Serial.println("HTTP alert skipped: set API_URL and DEVICE_TOKEN first.");
    return false;
  }

  // Wokwi-only convenience. For physical hardware, replace with setCACert().
  httpsNetwork.setInsecure();

  HTTPClient http;
  if (!http.begin(httpsNetwork, API_URL)) {
    Serial.println("HTTP alert failed: could not open API URL.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  StaticJsonDocument<192> document;
  document["deviceId"] = DEVICE_ID;
  document["type"] = "temperature";
  document["value"] = temperature;
  document["threshold"] = TEMPERATURE_THRESHOLD_C;
  document["unit"] = "C";
  if (String(HOME_ID).length() > 0 &&
      !String(HOME_ID).startsWith("replace-")) {
    document["homeId"] = HOME_ID;
  }

  String payload;
  serializeJson(document, payload);
  const int statusCode = http.POST(payload);
  const String response = http.getString();
  http.end();

  Serial.printf("HTTP alert response: %d\n", statusCode);
  Serial.println(response);
  return statusCode >= 200 && statusCode < 300;
}

void setup() {
  Serial.begin(115200);
  pinMode(ALERT_LED_PIN, OUTPUT);
  dht.setup(DHT_PIN, DHTesp::DHT22);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(256);

  connectWiFi();
  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  if (millis() - lastSampleAt < SAMPLE_INTERVAL_MS) {
    return;
  }
  lastSampleAt = millis();

  const TempAndHumidity reading = dht.getTempAndHumidity();
  if (isnan(reading.temperature) || isnan(reading.humidity)) {
    Serial.println("DHT22 read failed.");
    return;
  }

  Serial.printf(
      "Temperature: %.1f C, humidity: %.1f%%\n",
      reading.temperature,
      reading.humidity);
  publishTemperature(reading.temperature, reading.humidity);

  if (reading.temperature >= TEMPERATURE_THRESHOLD_C) {
    digitalWrite(ALERT_LED_PIN, HIGH);
    if (!alertPosted) {
      alertPosted = postTemperatureAlert(reading.temperature);
    }
  } else if (reading.temperature <= RESET_THRESHOLD_C) {
    digitalWrite(ALERT_LED_PIN, LOW);
    alertPosted = false;
  }
}
