import 'package:flutter/material.dart';

class LocksPage extends StatefulWidget {
  const LocksPage({super.key});

  @override
  State<LocksPage> createState() => _LocksPageState();
}

class _LocksPageState extends State<LocksPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      body: Center(child: Text("Locks Page")),
    );
  }
}
