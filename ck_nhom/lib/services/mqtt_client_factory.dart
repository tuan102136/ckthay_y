import 'package:mqtt_client/mqtt_client.dart';

import 'mqtt_client_factory_native.dart'
    if (dart.library.js_interop) 'mqtt_client_factory_web.dart' as mqtt_factory;

MqttClient createSmartHomeMqttClient(String clientId) {
  return mqtt_factory.createSmartHomeMqttClient(clientId);
}
