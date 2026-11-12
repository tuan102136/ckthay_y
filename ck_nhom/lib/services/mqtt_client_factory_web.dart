import 'package:mqtt_client/mqtt_browser_client.dart';
import 'package:mqtt_client/mqtt_client.dart';

MqttClient createSmartHomeMqttClient(String clientId) {
  return MqttBrowserClient.withPort(
    'wss://broker.hivemq.com/mqtt',
    clientId,
    8884,
  );
}
