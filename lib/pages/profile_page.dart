import 'package:flutter/material.dart';
import 'package:smart_home/auth/auth_service.dart';
import 'package:smart_home/util/sign_in_button.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  //get auth services
  final authService = AuthService();
  void logout() async {
    //logout logic
    await authService.signOut();
  }

  @override
  Widget build(BuildContext context) {
    //get user email
    final currentEmail = authService.getCurrentUserEmail();
    return Scaffold(
      backgroundColor: Colors.grey[300],
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.white),
        backgroundColor: Colors.grey[900],
        title: Text("Profile Page", style: TextStyle(color: Colors.grey[100])),

        actions: [
          //logout button
          IconButton(onPressed: logout, icon: Icon(Icons.logout)),
        ],
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              currentEmail.toString(),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 35),
            SignInButton(onTap: logout, text: "Logout"),
          ],
        ),
      ),
    );
  }
}
