#include <ArduinoJson.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <WiFi.h>

const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *MQTT_HOST = "broker.hivemq.com";
const uint16_t MQTT_PORT = 1883;
const char *DEVICE_ID = "esp32-dht22-01";

constexpr uint8_t DHT_PIN = 15;
constexpr uint8_t ALERT_LED_PIN = 2;
constexpr float TEMPERATURE_THRESHOLD_C = 35.0;
constexpr float RESET_THRESHOLD_C = 33.0;
constexpr unsigned long SAMPLE_INTERVAL_MS = 5000;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 5000;

WiFiClient networkClient;
PubSubClient mqttClient(networkClient);
DHT dht(DHT_PIN, DHT22);

String sensorTopic;
String controlTopic;
String acknowledgementTopic;
bool smartAcOn = false;
bool temperatureAlertActive = false;
unsigned long lastSampleAt = 0;
unsigned long lastMqttAttemptAt = 0;

void updateAlertLed() {
  digitalWrite(
      ALERT_LED_PIN,
      smartAcOn && temperatureAlertActive ? HIGH : LOW);
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  if (String(topic) != controlTopic) return;

  StaticJsonDocument<256> command;
  const DeserializationError error = deserializeJson(command, payload, length);
  if (error) {
    Serial.printf("Invalid MQTT command: %s\n", error.c_str());
    return;
  }

  const char *deviceId = command["deviceId"] | "";
  const char *type = command["type"] | "";
  const char *state = command["state"] | "";
  const char *commandId = command["commandId"] | "";
  if (String(deviceId) != DEVICE_ID || String(type) != "power" ||
      (String(state) != "on" && String(state) != "off") ||
      commandId[0] == '\0') {
    Serial.println("Ignored invalid or unrelated MQTT command.");
    return;
  }

  smartAcOn = String(state) == "on";
  if (smartAcOn) {
    lastSampleAt = millis() - SAMPLE_INTERVAL_MS;
  } else {
    temperatureAlertActive = false;
  }
  updateAlertLed();

  StaticJsonDocument<256> acknowledgement;
  acknowledgement["deviceId"] = DEVICE_ID;
  acknowledgement["commandId"] = commandId;
  acknowledgement["type"] = "power_ack";
  acknowledgement["state"] = smartAcOn ? "on" : "off";

  String response;
  serializeJson(acknowledgement, response);
  if (mqttClient.publish(acknowledgementTopic.c_str(), response.c_str())) {
    Serial.printf("Smart AC: %s\n", smartAcOn ? "ON" : "OFF");
  } else {
    Serial.println("Failed to publish power acknowledgement.");
  }
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }

  Serial.printf("\nWi-Fi connected. IP: %s\n",
                WiFi.localIP().toString().c_str());
}

void reconnectMqtt() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastMqttAttemptAt < MQTT_RETRY_INTERVAL_MS) return;
  lastMqttAttemptAt = millis();

  char clientId[40];
  snprintf(clientId, sizeof(clientId), "smart-home-%llx",
           static_cast<unsigned long long>(ESP.getEfuseMac()));

  Serial.print("Connecting to MQTT...");
  if (!mqttClient.connect(clientId)) {
    Serial.printf("failed (state %d)\n", mqttClient.state());
    return;
  }

  if (mqttClient.subscribe(controlTopic.c_str(), 1)) {
    Serial.println("connected and subscribed to control topic.");
  } else {
    Serial.println("connected, but failed to subscribe to control topic.");
    mqttClient.disconnect();
  }
}

void publishSensorReading() {
  const float temperature = dht.readTemperature();
  const float humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 reading failed.");
    return;
  }

  if (temperature >= TEMPERATURE_THRESHOLD_C) {
    temperatureAlertActive = true;
  } else if (temperature <= RESET_THRESHOLD_C) {
    temperatureAlertActive = false;
  }
  updateAlertLed();

  StaticJsonDocument<256> telemetry;
  telemetry["deviceId"] = DEVICE_ID;
  telemetry["type"] = "temperature";
  telemetry["value"] = temperature;
  telemetry["unit"] = "C";
  telemetry["humidity"] = humidity;
  telemetry["timestamp"] = millis();

  String payload;
  serializeJson(telemetry, payload);
  if (mqttClient.publish(sensorTopic.c_str(), payload.c_str())) {
    Serial.printf("Published: %.1f C, %.1f%% humidity\n",
                  temperature, humidity);
  } else {
    Serial.println("Failed to publish sensor reading.");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ALERT_LED_PIN, OUTPUT);
  digitalWrite(ALERT_LED_PIN, LOW);
  dht.begin();

  sensorTopic = String("smarthome/") + DEVICE_ID + "/temperature";
  controlTopic = String("smarthome/") + DEVICE_ID + "/control";
  acknowledgementTopic = String("smarthome/") + DEVICE_ID + "/ack";

  connectToWifi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(100);
    return;
  }

  if (!mqttClient.connected()) {
    reconnectMqtt();
  } else {
    mqttClient.loop();
  }

  if (smartAcOn && mqttClient.connected() &&
      millis() - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    lastSampleAt = millis();
    publishSensorReading();
  }
}
