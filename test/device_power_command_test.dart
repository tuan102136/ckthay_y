import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:smart_home/services/device_power_command.dart';

void main() {
  test('serializes an OFF command for the target device', () {
    final command = DevicePowerCommand(
      deviceId: 'esp32-dht22-01',
      commandId: 'cmd-123',
      isOn: false,
    );

    expect(jsonDecode(command.toJson()), {
      'deviceId': 'esp32-dht22-01',
      'commandId': 'cmd-123',
      'type': 'power',
      'state': 'off',
    });
  });

  test('serializes an ON command for the target device', () {
    final command = DevicePowerCommand(
      deviceId: 'esp32-dht22-01',
      commandId: 'cmd-456',
      isOn: true,
    );

    expect(jsonDecode(command.toJson()), {
      'deviceId': 'esp32-dht22-01',
      'commandId': 'cmd-456',
      'type': 'power',
      'state': 'on',
    });
  });
}
