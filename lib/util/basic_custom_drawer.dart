import 'package:flutter/material.dart';
import 'package:smart_home/approutes.dart';

class BasicCustomDrawer extends StatefulWidget {
  const BasicCustomDrawer({super.key});

  @override
  State<BasicCustomDrawer> createState() => _BasicCustomDrawerState();
}

class _BasicCustomDrawerState extends State<BasicCustomDrawer> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Drawer(
        backgroundColor: Colors.grey[900],
        child: Container(
          color: Colors.grey[900],
          child: ListView(
            children: [
              DrawerHeader(
                child: Image.asset(
                  "lib/assets/icons/SmartHome1.png",
                  color: Colors.grey[300],
                  colorBlendMode: BlendMode.srcIn,
                ),
              ),
              SizedBox(height: 20),
              ListTile(
                leading: Icon(Icons.home, color: Colors.grey[300]),
                title: Text("Home", style: TextStyle(color: Colors.grey[300])),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              SizedBox(height: 25),
              ListTile(
                leading: Icon(Icons.device_hub, color: Colors.grey[300]),
                title: Text(
                  "All Devices",
                  style: TextStyle(color: Colors.grey[300]),
                ),
                onTap: () {
                  Navigator.pushNamed(context, Approutes.allDevicesPage);
                },
              ),
              SizedBox(height: 25),

              ListTile(
                leading: Icon(Icons.lock, color: Colors.grey[300]),
                title: Text("Locks", style: TextStyle(color: Colors.grey[300])),
                onTap: () {
                  Navigator.pushNamed(context, Approutes.locksPage);
                },
              ),
              SizedBox(height: 290),

              Expanded(
                child: ListTile(
                  leading: Icon(Icons.person, color: Colors.grey[300]),
                  title: Text(
                    "Profile",
                    style: TextStyle(color: Colors.grey[300]),
                  ),
                  onTap: () {
                    Navigator.pushNamed(context, Approutes.profilePage);
                  },
                ),
              ),
            ],
          ),
          // child: Icon(Icons.home, size: 100, color: Colors.grey[300]),
        ),
      ),
    );
  }
}
