import 'package:flutter/material.dart';
import 'package:smart_home/approutes.dart';
import 'package:smart_home/auth/auth_gate.dart';
// import 'package:smart_home/pages/home_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  const supabaseKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  if (supabaseUrl.isEmpty || supabaseKey.isEmpty) {
    throw StateError('Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.');
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseKey,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Smart Home App',
      routes: Approutes.routes(),
      initialRoute: '/AuthGate',
      onGenerateRoute: (settings) {
        if (settings.name == '/') {
          return MaterialPageRoute(builder: (_) => const AuthGate());
        }
        return null;
      },
    );
    // return MaterialApp(debugShowCheckedModeBanner: false, home: AuthGate());
  }
}
