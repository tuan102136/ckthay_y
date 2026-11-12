import 'package:flutter/material.dart';

class SmartSpeakerPage extends StatefulWidget {
  const SmartSpeakerPage({super.key});

  @override
  State<SmartSpeakerPage> createState() => _SmartSpeakerPageState();
}

class _SmartSpeakerPageState extends State<SmartSpeakerPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.grey[300]),
        title: Text("Speaker", style: TextStyle(color: Colors.grey[100])),
        backgroundColor: Colors.grey[900],
      ),
      body: Center(
        child: Text(
          "Control volume, change songs",
          style: TextStyle(fontSize: 21, color: Colors.grey[900]),
        ),
      ),
    );
  }
}
