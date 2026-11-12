import 'package:flutter/material.dart';

class SmartTvPage extends StatefulWidget {
  const SmartTvPage({super.key});

  @override
  State<SmartTvPage> createState() => _SmartTvPageState();
}

class _SmartTvPageState extends State<SmartTvPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.grey[300]),
        title: Text("Smart TV", style: TextStyle(color: Colors.grey[100])),
        backgroundColor: Colors.grey[900],
      ),
      body: Center(
        child: Text(
          "Source and Volume Control Page",
          style: TextStyle(fontSize: 21, color: Colors.grey[900]),
        ),
      ),
    );
  }
}
