/*

Auth Gate - This will continuously check if the user is logged in or not and redirect accordingly.

-------

unauthenticated -> Login Page
authenticated -> Profile Page

 */

import 'package:flutter/material.dart';
// import 'package:smart_home/pages/profile_page.dart';
import 'package:smart_home/pages/sign_in_page.dart';
import 'package:smart_home/pages/home_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      // seeding the builder with current session
      initialData: AuthState(
        AuthChangeEvent.initialSession,
        Supabase.instance.client.auth.currentSession,
      ),
      builder: (context, snapshot) {
        //loading if there is waiting state
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        //check if there is a valid session currently
        final session =
            snapshot.data?.session ??
            Supabase.instance.client.auth.currentSession;
        if (session != null) {
          return const HomePage();
          // return const ProfilePage();
        } else {
          return const SignInPage();
        }
      },
    );
  }
}
