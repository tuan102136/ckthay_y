import 'package:flutter/material.dart';
import 'package:smart_home/auth/auth_gate.dart';
import 'package:smart_home/pages/home_page.dart';
import 'package:smart_home/pages/profile_page.dart';
import 'package:smart_home/pages/register_page.dart';
import 'package:smart_home/pages/sign_in_page.dart';
import 'package:smart_home/pages/Devices/smart_lights_page.dart';
import 'package:smart_home/pages/All_devices_page.dart';
import 'package:smart_home/pages/Devices/smart_ac_page.dart ';
import 'package:smart_home/pages/locks_page.dart';
import 'package:smart_home/pages/Devices/smart_speaker_page.dart';
import 'package:smart_home/pages/Devices/smart_tv_page.dart';

class Approutes {
  // first defining the names for the routes
  static const String homePage = '/home';
  static const String profilePage = '/profile';
  static const String signInPage = '/sign-in';
  static const String signUpPage = '/sign-up';
  static const String authGate = '/AuthGate';
  static const String allDevicesPage = '/allDevices';
  static const String locksPage = '/LocksPage';
  static const String lightPage = '/LightPage';
  static const String acPage = '/AcPage';
  static const String tvPage = '/TvPage';
  static const String speakerPage = '/SpeakerPage';
  // then creating a map of the routes
  static Map<String, WidgetBuilder> routes() {
    return {
      homePage: (context) => const HomePage(),
      profilePage: (context) => const ProfilePage(),
      signInPage: (context) => const SignInPage(),
      signUpPage: (context) => const RegisterPage(),
      authGate: (context) => const AuthGate(),
      lightPage: (context) => const SmartLightsPage(),
      allDevicesPage: (context) => const AllDevicesPage(),
      locksPage: (context) => const LocksPage(),
      acPage: (context) => const SmartAcPage(),
      tvPage: (context) => const SmartTvPage(),
      speakerPage: (context) => const SmartSpeakerPage(),
    };
  }
}
