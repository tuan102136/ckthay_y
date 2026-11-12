import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:smart_home/services/mqtt_client_factory.dart';
import 'package:smart_home/services/sensor_reading.dart';

class SmartAcPage extends StatefulWidget {
  const SmartAcPage({super.key, this.isPowered = false});

  final bool isPowered;

  @override
  State<SmartAcPage> createState() => _SmartAcPageState();
}

class _SmartAcPageState extends State<SmartAcPage> {
  static const _deviceId = 'esp32-dht22-01';
  static const _sensorTopic = 'smarthome/$_deviceId/temperature';

  MqttClient? _client;
  StreamSubscription<List<MqttReceivedMessage<MqttMessage?>>>? _updates;
  SensorReading? _reading;
  String? _connectionError;
  bool _isConnected = false;
  bool _isConnecting = false;
  bool _temperatureAlertActive = false;

  @override
  void initState() {
    super.initState();
    if (widget.isPowered) _connectToBroker();
  }

  Future<void> _connectToBroker() async {
    if (!widget.isPowered || _isConnecting) return;

    setState(() {
      _isConnecting = true;
      _connectionError = null;
    });

    final clientId =
        'smart-home-${Random().nextInt(0x7fffffff).toRadixString(16)}';
    final client = createSmartHomeMqttClient(clientId);
    _client = client;
    client.logging(on: false);
    client.keepAlivePeriod = 30;
    client.connectTimeoutPeriod = 5000;
    client.connectionMessage = MqttConnectMessage()
        .withClientIdentifier(clientId)
        .startClean();
    client.onDisconnected = () {
      if (mounted) setState(() => _isConnected = false);
    };

    try {
      final status = await client.connect();
      if (status?.state != MqttConnectionState.connected) {
        throw StateError('The MQTT broker rejected the connection.');
      }

      if (!mounted) {
        client.disconnect();
        return;
      }

      setState(() => _isConnected = true);
      client.subscribe(_sensorTopic, MqttQos.atMostOnce);
      _updates = client.updates?.listen(
        _handleMessages,
        onError: (Object error) {
          if (mounted) {
            setState(() => _connectionError = 'MQTT error: $error');
          }
        },
      );
    } catch (error) {
      client.disconnect();
      if (mounted) {
        setState(() {
          _isConnected = false;
          _connectionError = error.toString();
        });
      }
    } finally {
      if (mounted) setState(() => _isConnecting = false);
    }
  }

  void _handleMessages(List<MqttReceivedMessage<MqttMessage?>>? messages) {
    if (messages == null || !widget.isPowered) return;

    for (final message in messages) {
      final publishMessage = message.payload;
      if (publishMessage is! MqttPublishMessage) continue;

      final payload = MqttPublishPayload.bytesToStringAsString(
        publishMessage.payload.message,
      );
      try {
        final reading = SensorReading.fromPayload(
          payload,
          expectedDeviceId: _deviceId,
        );
        if (mounted) {
          setState(() {
            _reading = reading;
            if (reading.temperature >= 35) {
              _temperatureAlertActive = true;
            } else if (reading.temperature <= 33) {
              _temperatureAlertActive = false;
            }
            _connectionError = null;
          });
        }
      } on FormatException catch (error) {
        if (mounted) {
          setState(() => _connectionError = error.message);
        }
      }
    }
  }

  @override
  void dispose() {
    final updates = _updates;
    if (updates != null) unawaited(updates.cancel());
    final client = _client;
    _client = null;
    client?.onDisconnected = null;
    client?.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.grey[300]),
        title: Text("Smart AC", style: TextStyle(color: Colors.grey[100])),
        backgroundColor: Colors.grey[900],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Temprature Control Page",
                style: TextStyle(fontSize: 21, color: Colors.grey[900]),
              ),
              const SizedBox(height: 16),
              if (!widget.isPowered)
                Text(
                  'Smart AC đang tắt. Bật nút nguồn ở trang chủ để xem nhiệt độ và độ ẩm.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[700]),
                )
              else ...[
                Text(
                  _isConnecting
                      ? 'Đang kết nối MQTT...'
                      : _isConnected
                      ? 'Đã kết nối MQTT'
                      : 'Chưa kết nối MQTT',
                  style: TextStyle(color: Colors.grey[700]),
                ),
                const SizedBox(height: 12),
                Text(
                  'Nhiệt độ: ${_reading?.temperature.toStringAsFixed(1) ?? '--'} °C',
                  style: TextStyle(fontSize: 21, color: Colors.grey[900]),
                ),
                const SizedBox(height: 8),
                Text(
                  'Độ ẩm: ${_reading?.humidity.toStringAsFixed(1) ?? '--'} %',
                  style: TextStyle(fontSize: 21, color: Colors.grey[900]),
                ),
                if (_isConnected && _reading == null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Đang chờ dữ liệu từ ESP32.',
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ],
                if (_temperatureAlertActive) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Cảnh báo: nhiệt độ cao',
                    style: TextStyle(color: Colors.red, fontSize: 18),
                  ),
                ],
                if (_connectionError != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _connectionError!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ],
                if (!_isConnected && !_isConnecting) ...[
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _connectToBroker,
                    child: const Text('Thử kết nối lại'),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
