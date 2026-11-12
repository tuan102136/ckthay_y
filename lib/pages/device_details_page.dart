import 'package:flutter/material.dart';

class DeviceDetailsPage extends StatelessWidget {
  final String deviceName;

  const DeviceDetailsPage({super.key, required this.deviceName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.grey[300]),
        title: Text(deviceName, style: TextStyle(color: Colors.grey[300])),
        backgroundColor: Colors.grey[900],
      ),
      body: Center(child: Text("Details for $deviceName")),
    );
  }
}
