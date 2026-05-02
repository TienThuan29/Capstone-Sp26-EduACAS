import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/quiz_practice.dart';

Future<bool> showQuizPasscodeDialog(BuildContext context, ClassroomQuiz classroomQuiz) async {
  final rawPasscode = classroomQuiz.passcode?.trim();
  if (rawPasscode == null || rawPasscode.isEmpty || rawPasscode.toLowerCase() == 'null') {
    return true; // No passcode required
  }

  final expectedPasscode = rawPasscode;
  final controller = TextEditingController();
  final formKey = GlobalKey<FormState>();

  final bool? result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.lock_outline, color: AppColors.primary),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Quiz Passcode',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'This quiz is protected. Please enter the passcode provided by your lecturer to proceed.',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: controller,
                  decoration: InputDecoration(
                    labelText: 'Passcode',
                    hintText: 'Enter passcode',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    isDense: true,
                    prefixIcon: const Icon(Icons.key_rounded, size: 20),
                  ),
                  obscureText: true,
                  autofocus: true,
                  textInputAction: TextInputAction.done,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Passcode is required';
                    }
                    if (value.trim() != expectedPasscode) {
                      return 'Incorrect passcode. Please try again.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                      ),
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState?.validate() ?? false) {
                          Navigator.pop(context, true);
                        }
                      },
                      child: const Text('Verify & Enter'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    },
  );

  return result ?? false;
}
