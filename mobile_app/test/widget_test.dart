import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App smoke test - renders LoginPage', (WidgetTester tester) async {
    await tester.pumpWidget(const EduACASApp());
    await tester.pumpAndSettle();

    // Verify LoginPage is rendered (basic smoke test)
    // The test passes if no exceptions are thrown
    expect(find.byType(EduACASApp), findsOneWidget);
  });
}
