import 'dart:convert';

class DevicePowerCommand {
  const DevicePowerCommand({
    required this.deviceId,
    required this.commandId,
    required this.isOn,
  });

  final String deviceId;
  final String commandId;
  final bool isOn;

  Map<String, Object> toMap() => {
    'deviceId': deviceId,
    'commandId': commandId,
    'type': 'power',
    'state': isOn ? 'on' : 'off',
  };

  String toJson() => jsonEncode(toMap());
}
