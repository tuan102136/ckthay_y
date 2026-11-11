#include <Arduino.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WiFi.h>

#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLEDevice.h>
#include <BLEAdvertising.h>

#define SERVICE_UUID "5617df76-39f3-44b0-aa1b-c8e71e4caeba"
#define CHARACTERISTIC_UUID "564c9b11-b549-4af0-9675-75225dba6db2"
String DEVICE_ID = "5d381f40-61aa-4360-a8d0-3e8d978c4b8e";

String availableNetworks[20] = {""};
String ssid = "";
String password = "";
bool connectionError = false;

Preferences preferences;
StaticJsonBuffer<200> jsonBuffer;

BLECharacteristic *pCharacteristic;
BLEAdvertising *pAdvertising;
BLEService *pService;
BLEServer *pServer;

class CustomServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    Serial.println("BLE client connected");
    pAdvertising->stop();
  };

  void onDisconnect(BLEServer *pServer)
  {
    Serial.println("BLE client disconnected");
    pAdvertising->start();
  }
};

class CustomCharacteristicCallbacks : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pCharacteristic)
  {
    std::string value = pCharacteristic->getValue();

    if (value.length() == 0)
    {
      return;
    }

    Serial.println("Received over BLE: " + String((char *)&value[0]));
    JsonObject &jsonIn = jsonBuffer.parseObject((char *)&value[0]);

    if (jsonIn.success())
    {
      if (jsonIn.containsKey("ssid") &&
          jsonIn.containsKey("password"))
      {
        ssid = jsonIn["ssid"].as<String>();
        password = jsonIn["password"].as<String>();

        Serial.println("Received over bluetooth:");
        Serial.println("SSID: " + ssid + ", password: " + password);
      }
    }
    else
    {
      Serial.println("Received invalid JSON");
    }

    jsonBuffer.clear();
  };

  void onRead(BLECharacteristic *pCharacteristic)
  {
    Serial.println("BLE onRead request");
    String response;

    JsonObject &jsonOut = jsonBuffer.createObject();
    jsonOut["key"] = DEVICE_ID;

    if (WiFi.status() == WL_CONNECTED)
    {
      jsonOut["connected"] = true;
    }
    else
    {
      JsonArray &ssids = jsonOut.createNestedArray("ssids");
      jsonOut["error"] = connectionError;

      for (int i = 0; i < 20; i++)
      {
        if (availableNetworks[i] != "")
        {
          ssids.add(availableNetworks[i]);
        }
      }
    }

    jsonOut.printTo(response);

    Serial.println(response);

    pCharacteristic->setValue(
        (uint8_t *)&response[0], response.length());

    jsonBuffer.clear();
  }
};

void finishBLE()
{
  BLEDevice::deinit(false);
}

void initBLE()
{
  BLEDevice::init("SmartHome: Relay");
  BLEDevice::setPower(ESP_PWR_LVL_P7);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new CustomServerCallbacks());

  pService = pServer->createService(BLEUUID(SERVICE_UUID), 20);

  pCharacteristic = pService->createCharacteristic(
      BLEUUID(CHARACTERISTIC_UUID),
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE);
  pCharacteristic->setCallbacks(new CustomCharacteristicCallbacks());

  pService->start();

  pAdvertising = pServer->getAdvertising();
  pAdvertising->start();
}

void getStoredCredentials()
{
  preferences.begin("credentials", true);

  String WIFI_SSID = preferences.getString("WIFI_SSID", "");
  String WIFI_PASSWORD = preferences.getString("WIFI_PASSWORD", "");

  preferences.end();

  if (WIFI_SSID != "" && WIFI_PASSWORD != "")
  {
    ssid = WIFI_SSID;
    password = WIFI_PASSWORD;
  }
}

void saveCredentials()
{
  preferences.begin("credentials", false);

  preferences.putString("WIFI_SSID", ssid);
  preferences.putString("WIFI_PASSWORD", password);

  preferences.end();
}

void getAvailableNetworks()
{
  WiFi.mode(WIFI_STA);

  int numberOfNetworks = WiFi.scanNetworks();

  if (numberOfNetworks > 0)
  {
    for (int i = 0; i < numberOfNetworks; ++i)
    {
      availableNetworks[i] = WiFi.SSID(i);
    }
  }
}

bool connectToWiFi(String selectedSSID, String selectedPassword)
{
  WiFi.begin(selectedSSID.c_str(), selectedPassword.c_str());
  Serial.println("Connecting to Wi-Fi ...");

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries <= 15)
  {
    tries++;
    delay(300);
  }

  return WiFi.status() == WL_CONNECTED;
}
