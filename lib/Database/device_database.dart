import 'package:smart_home/Database/device.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DeviceDatabase {
  // Database -> Devices

  final database = Supabase.instance.client.from('devices');

  // Create
  Future<void> addDevice(Device newDevice) async {
    await database.insert(newDevice.toMap());
  }

  // Read
  final stream = Supabase.instance.client
      .from('devices')
      .stream(primaryKey: ['id'])
      .map(
        (data) => data.map((deviceMap) => Device.fromMap(deviceMap)).toList(),
      );

  // Update
  Future<void> updateDevices(Device oldDevice, String newContent) async {
    final deviceId = oldDevice.id;
    if (deviceId == null) {
      throw StateError('Cannot update a device without an id.');
    }
    await database.update({'content': newContent}).eq('id', deviceId);
  }

  // Delete
  Future<void> deleteDevice(Device device) async {
    await database.delete().eq('id', device.id!);
  }
}
