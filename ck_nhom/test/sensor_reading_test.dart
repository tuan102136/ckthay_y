import 'package:flutter_test/flutter_test.dart';
import 'package:smart_home/services/sensor_reading.dart';

void main() {
  test('parses temperature and humidity from an MQTT payload', () {
    final reading = SensorReading.fromPayload(
      '{"deviceId":"esp32-dht22-01","type":"temperature",'
      '"value":24.5,"unit":"C","humidity":55,"timestamp":5000}',
      expectedDeviceId: 'esp32-dht22-01',
    );

    expect(reading.temperature, 24.5);
    expect(reading.humidity, 55);
  });

  test('rejects payloads without numeric sensor values', () {
    expect(
      () => SensorReading.fromPayload(
        '{"deviceId":"esp32-dht22-01","type":"temperature",'
        '"value":"warm","unit":"C","humidity":55}',
        expectedDeviceId: 'esp32-dht22-01',
      ),
      throwsFormatException,
    );
  });

  test('rejects messages from a different device', () {
    expect(
      () => SensorReading.fromPayload(
        '{"deviceId":"other-device","type":"temperature",'
        '"value":24.5,"unit":"C","humidity":55}',
        expectedDeviceId: 'esp32-dht22-01',
      ),
      throwsFormatException,
    );
  });
}
