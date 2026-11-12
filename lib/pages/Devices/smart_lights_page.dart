import 'package:flutter/material.dart';

class SmartLightsPage extends StatefulWidget {
  const SmartLightsPage({super.key});

  @override
  State<SmartLightsPage> createState() => _LightsPageState();
}

class _LightsPageState extends State<SmartLightsPage> {
  //creating variable for slider
  double _currentSliderValue = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.grey[300]),
        title: Text("Smart Lights", style: TextStyle(color: Colors.grey[100])),
        backgroundColor: Colors.grey[900],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Text(
              'lumens:',
              style: TextStyle(fontSize: 30, color: Colors.grey[700]),
            ),
            Text(
              '${_currentSliderValue.round()}',
              style: TextStyle(fontSize: 50, color: Colors.grey[900]),
            ),

            // Text(
            //   " Lumens: ${_currentSliderValue.round().toString()}",
            //   style: TextStyle(fontSize: 50, color: Colors.grey[900]),
            // ),
            Slider(
              value: _currentSliderValue,
              max: 100,
              min: 0,
              label: "Lumens",
              activeColor: Colors.grey[900],
              inactiveColor: Colors.grey[700],
              thumbColor: Colors.grey[900],
              onChanged: (value) {
                setState(() {
                  _currentSliderValue = value;
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}
