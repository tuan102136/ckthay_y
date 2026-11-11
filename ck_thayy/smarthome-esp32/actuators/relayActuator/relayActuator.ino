#include "wifiConnector.h"
#include "secrets.h"
// Firebase dependencies
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define actuatorPin 26

FirebaseData firebaseDataObject;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

enum STATES
{
  CONNECTING,
  CONNECTED,
  SUCCESS,
  FAILED,
  SCANNING,
  WAITING
};

enum STATES currentState;

bool connectionSuccess;

void signupToFirebase()
{
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonymous sign-in
  if (Firebase.signUp(&config, &auth, "", ""))
  {
    signupOK = true;
  }
  else
  {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void processDeviceWork()
{
  if (Firebase.ready() && signupOK)
  {
    if (Firebase.RTDB.get(&firebaseDataObject, "device/" + DEVICE_ID + "/write"))
    {
      if (firebaseDataObject.dataType() == "string")
      {
        String pendingWrite = firebaseDataObject.to<String>();

        if (pendingWrite == "TOGGLE_ON")
        {
          digitalWrite(actuatorPin, LOW);
          Firebase.RTDB.setBool(&firebaseDataObject, "device/" + DEVICE_ID + "/state", true);
          Serial.println("Successfully written LOW.");
        }
        else if (pendingWrite == "TOGGLE_OFF")
        {
          digitalWrite(actuatorPin, HIGH);
          Firebase.RTDB.setBool(&firebaseDataObject, "device/" + DEVICE_ID + "/state", false);
          Serial.println("Successfully written HIGH.");
        }
        else
        {
          Serial.println("Undefined action. NO-OP.");
        }

        Firebase.RTDB.deleteNode(&firebaseDataObject, "device/" + DEVICE_ID + "/write");
      }
    }
    else
    {
      Serial.println("Failed to read pending write. Reason: " + firebaseDataObject.errorReason());
    }
  }
  else
  {
    signupToFirebase();
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(actuatorPin, OUTPUT);
  digitalWrite(actuatorPin, HIGH);

  getStoredCredentials();

  if (ssid != "" && password != "")
  {
    currentState = CONNECTING;
  }
  else
  {
    currentState = SCANNING;
  }
}

void loop()
{
  switch (currentState)
  {
  case CONNECTED:
    Serial.println("CONNECTED");

    processDeviceWork();

    delay(2000);
    break;

  case SCANNING:
    Serial.println("SCANNING");

    getAvailableNetworks();

    currentState = WAITING;
    break;

  case WAITING:
    Serial.println("WAITING");

    if (BLEDevice::getInitialized() == false)
    {
      initBLE();
      delay(2000);
    }

    if (ssid != "" && password != "")
    {
      currentState = CONNECTING;
    }

    delay(5000);
    break;

  case CONNECTING:
    Serial.println("CONNECTING");

    connectionSuccess = connectToWiFi(ssid, password);

    currentState = connectionSuccess ? SUCCESS : FAILED;
    break;

  case FAILED:
    Serial.println("FAILED");

    ssid = "";
    password = "";
    connectionError = true;
    currentState = SCANNING;
    break;

  case SUCCESS:
    Serial.println("SUCCESS");

    saveCredentials();
    delay(5000);

    if (BLEDevice::getInitialized() == true)
    {
      finishBLE();
    }

    connectionError = false;
    currentState = CONNECTED;
    break;

  default:
    break;
  }
}
