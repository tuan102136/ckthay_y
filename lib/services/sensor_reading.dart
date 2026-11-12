import 'dart:convert';

class SensorReading {
  const SensorReading({required this.temperature, required this.humidity});

  final double temperature;
  final double humidity;

  factory SensorReading.fromPayload(
    String payload, {
    required String expectedDeviceId,
  }) {
    final decoded = jsonDecode(payload);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Sensor payload must be a JSON object.');
    }

    final temperature = decoded['value'];
    final humidity = decoded['humidity'];
    if (decoded['deviceId'] != expectedDeviceId ||
        decoded['type'] != 'temperature' ||
        decoded['unit'] != 'C' ||
        temperature is! num ||
        humidity is! num ||
        !temperature.isFinite ||
        !humidity.isFinite) {
      throw const FormatException(
        'Expected a matching temperature device with numeric value and humidity.',
      );
    }

    return SensorReading(
      temperature: temperature.toDouble(),
      humidity: humidity.toDouble(),
    );
  }
}
