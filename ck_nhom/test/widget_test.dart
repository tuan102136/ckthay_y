import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_home/pages/sign_in_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  setUpAll(() async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('plugins.flutter.io/shared_preferences'),
          (call) async => call.method == 'getAll' ? <String, Object>{} : null,
        );
    await Supabase.initialize(
      url: 'https://example.supabase.co',
      anonKey: 'test-publishable-key',
    );
  });

  testWidgets('renders the email sign-in screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SignInPage()));

    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text("welcome back you've been missed!"), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
