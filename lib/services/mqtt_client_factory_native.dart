import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';

MqttClient createSmartHomeMqttClient(String clientId) {
  return MqttServerClient.withPort('broker.hivemq.com', clientId, 1883);
}
