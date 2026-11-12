import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_home/pages/Devices/smart_ac_page.dart';

void main() {
  testWidgets('hides sensor readings while Smart AC is off', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: SmartAcPage(isPowered: false),
      ),
    );

    expect(find.textContaining('Smart AC đang tắt'), findsOneWidget);
    expect(find.textContaining('Nhiệt độ:'), findsNothing);
    expect(find.textContaining('Độ ẩm:'), findsNothing);
    expect(find.text('Chưa kết nối MQTT'), findsNothing);
  });
}
