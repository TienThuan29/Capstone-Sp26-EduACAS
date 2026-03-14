import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

class EnhancedTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final Function(String)? onChanged;
  final Function(String)? onFieldSubmitted;

  const EnhancedTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
    this.validator,
    this.onChanged,
    this.onFieldSubmitted,
  });

  OutlineInputBorder _buildBorder(Color color, {double width = 1.5}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            obscureText: obscureText,
            validator: validator,
            onChanged: onChanged,
            onFieldSubmitted: onFieldSubmitted,
            style: TextStyle(fontSize: 15, color: Colors.grey[800]),
            cursorColor: AppColors.primary,
            enableInteractiveSelection: true,
            autofocus: false,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              prefixIcon: Padding(
                padding: const EdgeInsets.only(left: 12, right: 8),
                child: Icon(icon, color: AppColors.primaryLight, size: 20),
              ),
              prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              suffixIcon: suffixIcon != null
                  ? Padding(
                      padding: const EdgeInsets.only(right: 12, left: 8),
                      child: suffixIcon,
                    )
                  : null,
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: _buildBorder(Colors.grey[200]!, width: 1.0),
              enabledBorder: _buildBorder(Colors.grey[200]!, width: 1.0),
              focusedBorder: _buildBorder(AppColors.primary, width: 2.0),
              errorBorder: _buildBorder(AppColors.error),
              focusedErrorBorder: _buildBorder(AppColors.error),
            ),
          ),
        ),
      ],
    );
  }
}