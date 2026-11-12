import 'dart:math';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class SmartDeviceBox extends StatelessWidget {
  final String smartDevicesName;
  final String iconPath;
  final bool powerOn;
  final ValueChanged<bool>? onChanged;
  final onTap;

  const SmartDeviceBox({
    super.key,
    required this.smartDevicesName,
    required this.iconPath,
    required this.powerOn,
    required this.onChanged,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10.0),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: powerOn ? Colors.grey[900] : Colors.grey[100],
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.shade900,
                offset: const Offset(5.0, 5.0),
                blurRadius: 15.0,
                spreadRadius: 1.0,
              ),
              BoxShadow(
                color: Colors.white,
                offset: const Offset(-5.0, -5.0),
                blurRadius: 15.0,
                spreadRadius: 1.0,
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                //icon
                Image.asset(
                  iconPath,
                  height: 55,
                  color: powerOn ? Colors.grey[100] : Colors.grey[900],
                ),
                //smart device name + switch
                Row(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(left: 10),
                        child: Text(
                          smartDevicesName,
                          style: TextStyle(
                            fontSize: 18,
                            color: powerOn
                                ? Colors.grey[100]
                                : Colors.grey[900],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    Transform.rotate(
                      angle: pi / 2,
                      child: CupertinoSwitch(
                        value: powerOn,
                        onChanged: onChanged,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
