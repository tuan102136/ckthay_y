import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:mqtt_client/mqtt_client.dart';
import 'package:smart_home/services/device_power_command.dart';
import 'package:smart_home/services/mqtt_client_factory.dart';

class MqttDeviceControl {
  Future<void> setPower({required String deviceId, required bool isOn}) async {
    final clientId =
        'smart-home-control-${Random().nextInt(0x7fffffff).toRadixString(16)}';
    final commandId =
        'cmd-${DateTime.now().microsecondsSinceEpoch}-${Random().nextInt(0x7fffffff)}';
    final client = createSmartHomeMqttClient(clientId);
    final controlTopic = 'smarthome/$deviceId/control';
    final acknowledgementTopic = 'smarthome/$deviceId/ack';

    client.logging(on: false);
    client.keepAlivePeriod = 30;
    client.connectTimeoutPeriod = 5000;
    client.connectionMessage = MqttConnectMessage()
        .withClientIdentifier(clientId)
        .startClean();

    try {
      final status = await client.connect();
      if (status?.state != MqttConnectionState.connected) {
        throw StateError('The MQTT broker rejected the connection.');
      }

      final deviceAcknowledged = Completer<void>();
      final acknowledgementSubscription = client.updates?.listen(
        (messages) {
          for (final message in messages) {
            final messagePayload = message.payload;
            if (message.topic != acknowledgementTopic ||
                messagePayload is! MqttPublishMessage) {
              continue;
            }

            final payload = MqttPublishPayload.bytesToStringAsString(
              messagePayload.payload.message,
            );
            try {
              final decoded = jsonDecode(payload);
              if (decoded is Map<String, dynamic> &&
                  decoded['deviceId'] == deviceId &&
                  decoded['commandId'] == commandId &&
                  decoded['type'] == 'power_ack' &&
                  decoded['state'] == (isOn ? 'on' : 'off') &&
                  !deviceAcknowledged.isCompleted) {
                deviceAcknowledged.complete();
              }
            } on FormatException {
              continue;
            }
          }
        },
        onError: (Object error) {
          if (!deviceAcknowledged.isCompleted) {
            deviceAcknowledged.completeError(error);
          }
        },
      );

      if (acknowledgementSubscription == null) {
        throw StateError(
          'The MQTT client cannot receive device acknowledgements.',
        );
      }

      try {
        final subscription = client.subscribe(
          acknowledgementTopic,
          MqttQos.atMostOnce,
        );
        if (subscription == null) {
          throw StateError(
            'Could not subscribe to the device acknowledgement topic.',
          );
        }

        final message = MqttClientPayloadBuilder()
          ..addString(
            DevicePowerCommand(
              deviceId: deviceId,
              commandId: commandId,
              isOn: isOn,
            ).toJson(),
          );
        final bytes = message.payload;
        if (bytes == null) {
          throw StateError('Failed to build the MQTT power command.');
        }

        client.publishMessage(controlTopic, MqttQos.atLeastOnce, bytes);
        await deviceAcknowledged.future.timeout(
          const Duration(seconds: 8),
          onTimeout: () {
            throw TimeoutException(
              'The ESP32 did not acknowledge the power command. Make sure it is powered on and connected to MQTT.',
            );
          },
        );
      } finally {
        await acknowledgementSubscription.cancel();
      }
    } finally {
      client.disconnect();
    }
  }
}
