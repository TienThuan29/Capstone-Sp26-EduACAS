import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/core/widgets/enhanced_button.dart';
import 'profile_controller.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onLogout;

  const ProfileScreen({super.key, this.onLogout});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _controller = ProfileController();
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _birthdayController;
  late TextEditingController _roleController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _birthdayController = TextEditingController();
    _roleController = TextEditingController();
    
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    await _controller.fetchProfile(() {
      if (mounted) setState(() {});
    });

    if (_controller.userProfile != null) {
      _nameController.text = _controller.userProfile!.fullname;
      _emailController.text = _controller.userProfile!.email;
      
      String bday = _controller.userProfile!.birthday ?? '';
      if (bday.isNotEmpty) {
        if (bday.contains('T')) {
          bday = bday.split('T')[0];
        } else if (bday.contains(' ')) {
          bday = bday.split(' ')[0];
        }
      }
      _birthdayController.text = bday;
      
      _roleController.text = _controller.userProfile!.role;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _birthdayController.dispose();
    _roleController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdate() async {
    if (_formKey.currentState!.validate()) {
      final success = await _controller.updateProfile({
        'fullname': _nameController.text,
        'birthday': _birthdayController.text,
      }, () {
        if (mounted) setState(() {});
      });

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_controller.errorMessage ?? 'Update failed'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: _controller.isLoading && _controller.userProfile == null
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildHeader(),
                        const SizedBox(height: 32),
                        _buildAvatarSection(),
                        const SizedBox(height: 32),
                        _buildProfileForm(),
                        const SizedBox(height: 32),
                        EnhancedButton(
                          text: 'Save Changes',
                          isLoading: _controller.isLoading,
                          onPressed: _handleUpdate,
                        ),
                        if (widget.onLogout != null) ...[
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: widget.onLogout,
                              icon: const Icon(Icons.logout, size: 20),
                              label: const Text('Logout'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.error,
                                side: const BorderSide(color: AppColors.error),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
          ),
          if (ModalRoute.of(context)?.canPop ?? false)
            Positioned(
              top: 50,
              left: 20,
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios, color: AppColors.primary),
                onPressed: () => Navigator.pop(context),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        const Text(
          'Profile Settings',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Manage your personal information',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildAvatarSection() {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: CircleAvatar(
            radius: 60,
            backgroundColor: Colors.white,
            backgroundImage: _controller.userProfile?.avatarUrl != null && _controller.userProfile!.avatarUrl.isNotEmpty
                ? NetworkImage(_controller.userProfile!.avatarUrl)
                : null,
            child: _controller.userProfile?.avatarUrl == null || _controller.userProfile!.avatarUrl.isEmpty
                ? const Icon(Icons.person, size: 60, color: AppColors.primaryLight)
                : null,
          ),
        ),
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.camera_alt,
              color: Colors.white,
              size: 20,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _ProfileTextField(
            controller: _nameController,
            label: 'Full Name',
            hint: 'Enter your full name',
            icon: Icons.person_outline,
            validator: (value) =>
                value == null || value.isEmpty ? 'Please enter your name' : null,
          ),
          const SizedBox(height: 20),
          _ProfileTextField(
            controller: _emailController,
            label: 'Email',
            hint: 'Your email address',
            icon: Icons.email_outlined,
            readOnly: true,
          ),
          const SizedBox(height: 20),
          _ProfileTextField(
            controller: _birthdayController,
            label: 'Birthday',
            hint: 'YYYY-MM-DD',
            icon: Icons.cake_outlined,
            readOnly: true,
            onTap: () async {
              DateTime? picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                _birthdayController.text = picked.toString().split(' ')[0];
              }
            },
          ),
          const SizedBox(height: 20),
          _ProfileTextField(
            controller: _roleController,
            label: 'Role',
            hint: 'Your user role',
            icon: Icons.work_outline,
            readOnly: true,
          ),
        ],
      ),
    );
  }
}

class _ProfileTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool readOnly;
  final VoidCallback? onTap;
  final String? Function(String?)? validator;

  const _ProfileTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.readOnly = false,
    this.onTap,
    this.validator,
  });

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
        TextFormField(
          controller: controller,
          readOnly: readOnly,
          onTap: onTap,
          validator: validator,
          style: TextStyle(fontSize: 15, color: readOnly ? Colors.grey[600] : Colors.grey[800]),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.primaryLight, size: 20),
            filled: true,
            fillColor: readOnly ? Colors.grey[200] : Colors.grey[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
