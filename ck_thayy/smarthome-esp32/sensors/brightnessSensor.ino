#define sensorPin A0

void setup()
{
  Serial.begin(9600);
}

void loop()
{
  int adcValue = analogRead(sensorPin);

  // Here the value  3000 represents a normal room with the lights on.
  float adcInPercentage = min((adcValue / 3000.0) * 100.0, 100.0);

  Serial.print("Brightness: ");
  Serial.print(adcInPercentage);
  Serial.println("%");

  delay(1000);
}
