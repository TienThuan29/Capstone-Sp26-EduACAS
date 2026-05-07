import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:file_picker/file_picker.dart';
import 'profile_controller.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onLogout;

  const ProfileScreen({
    super.key,
    this.onLogout,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with TickerProviderStateMixin {
  final _controller = ProfileController();

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  late AnimationController _staggerController;

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    ));

    _staggerController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _loadProfile();
    _fadeController.forward();
  }

  Future<void> _loadProfile() async {
    await _controller.fetchProfile(() {
      if (mounted) {
        setState(() {});
        _runStaggerAnimation();
      }
    });

    if (_controller.userProfile != null && mounted) {
      _runStaggerAnimation();
    }
  }

  void _runStaggerAnimation() {
    _staggerController.reset();
    _staggerController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _staggerController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadAvatar() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;
      
      // Explicitly check extension
      final extension = file.extension?.toLowerCase();
      final allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (extension != null && !allowedExtensions.contains(extension)) {
        if (mounted) {
          _showErrorDialog(
            'Invalid format',
            'Please select an image in JPG, PNG, WebP or GIF format.',
          );
        }
        return;
      }

      // Limit 5MB
      if (file.size > 5 * 1024 * 1024) {
        if (mounted) {
          _showErrorDialog(
            'File too large',
            'The image size must be less than 5MB.',
          );
        }
        return;
      }

      if (file.bytes == null) return;

      final url = await _controller.uploadAvatar(
        file.bytes!,
        file.name,
        () => setState(() {}),
      );

      if (url != null) {
        final success = await _controller.updateProfile(
          {'avatarUrl': url},
          () => setState(() {}),
        );

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Avatar updated successfully')),
          );
        } else if (mounted) {
          _showErrorDialog('Update failed', _controller.errorMessage ?? 'Please try again.');
        }
      } else if (mounted) {
        _showErrorDialog('Upload failed', _controller.errorMessage ?? 'Please try again.');
      }
    } catch (e) {
      if (mounted) {
        String cleanMessage = e.toString().replaceAll('Exception: ', '');
        _showErrorDialog('Upload failed', cleanMessage);
      }
    }
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red),
            const SizedBox(width: 10),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;

    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: _controller.isLoading && _controller.userProfile == null
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: SlideTransition(
                          position: _slideAnimation,
                          child: FadeTransition(
                            opacity: _fadeAnimation,
                            child: _buildAppBar(context),
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: _buildHeroSection(context, isTablet),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: _buildStatsBar(context, isTablet),
                      ),
                      SliverToBoxAdapter(
                        child: _buildProfileInfoSection(context, isTablet),
                      ),
                      SliverToBoxAdapter(
                        child: _buildActionSection(context, isTablet),
                      ),
                      const SliverToBoxAdapter(
                        child: SizedBox(height: 32),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          if (Navigator.of(context).canPop())
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 18,
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context, bool isTablet) {
    final profile = _controller.userProfile;
    final initials = _getInitials(profile?.fullname ?? 'U');
    final avatarSize = isTablet ? 200.0 : 160.0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.2),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              GestureDetector(
                onTap: () {
                  if (profile?.avatarUrl != null && profile!.avatarUrl.isNotEmpty) {
                    _showFullImage(context, profile.avatarUrl);
                  }
                },
                child: Hero(
                  tag: 'profile_avatar',
                  child: Container(
                    width: avatarSize,
                    height: avatarSize,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      shape: BoxShape.circle,
                      image: profile?.avatarUrl != null &&
                              profile!.avatarUrl.isNotEmpty
                          ? DecorationImage(
                              image: NetworkImage(profile!.avatarUrl),
                              fit: BoxFit.cover,
                            )
                          : null,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          blurRadius: 15,
                          spreadRadius: 2,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: profile?.avatarUrl == null ||
                            profile!.avatarUrl.isEmpty
                        ? Center(
                            child: Text(
                              initials,
                              style: TextStyle(
                                fontSize: avatarSize / 2.5,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                                letterSpacing: 1,
                              ),
                            ),
                          )
                        : null,
                  ),
                ),
              ),
              Positioned(
                bottom: -5,
                right: -5,
                child: GestureDetector(
                  onTap: _pickAndUploadAvatar,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: _controller.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(
                            Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFullImage(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          alignment: Alignment.center,
          children: [
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: double.infinity,
                height: double.infinity,
                color: Colors.black.withValues(alpha: 0.9),
              ),
            ),
            Hero(
              tag: 'profile_avatar',
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.contain,
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsBar(BuildContext context, bool isTablet) {
    return const SizedBox.shrink();
  }

  Widget _buildProfileInfoSection(BuildContext context, bool isTablet) {
    final profile = _controller.userProfile;
    final items = <_InfoItem>[
      _InfoItem(
        icon: Icons.person_outline_rounded,
        label: 'Full Name',
        value: profile?.fullname ?? '-',
      ),
      _InfoItem(
        icon: Icons.email_outlined,
        label: 'Email Address',
        value: profile?.email ?? '-',
      ),
      _InfoItem(
        icon: Icons.cake_outlined,
        label: 'Birthday',
        value: _formatBirthday(profile?.birthday),
      ),
      _InfoItem(
        icon: Icons.badge_outlined,
        label: 'Role',
        value: _formatRole(profile?.role ?? '-'),
      ),
      _InfoItem(
        icon: Icons.numbers_rounded,
        label: 'Role Number',
        value: profile?.roleNumber.isNotEmpty == true
            ? profile!.roleNumber
            : 'Not assigned',
      ),
    ];

    return AnimatedBuilder(
      animation: _staggerController,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, 10 * (1 - _staggerController.value)),
          child: Opacity(
            opacity: _staggerController.value,
            child: child,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return _buildInfoRow(item, isLast: index == items.length - 1);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(_InfoItem item, {required bool isLast}) {
    return Container(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16, top: 16),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                  color: Colors.grey.withValues(alpha: 0.06),
                ),
              ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              item.icon,
              size: 18,
              color: AppColors.primaryLight,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textLight,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  item.value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context, bool isTablet) {
    if (widget.onLogout == null) return const SizedBox.shrink();

    return AnimatedBuilder(
      animation: _staggerController,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, 10 * (1 - _staggerController.value)),
          child: Opacity(
            opacity: _staggerController.value,
            child: child,
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: _ActionButton(
          icon: Icons.logout_rounded,
          label: 'Sign Out',
          color: Colors.red.shade50,
          textColor: Colors.red.shade700,
          onTap: () => _showLogoutConfirmation(context),
        ),
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.logout_rounded,
                size: 32,
                color: Colors.red.shade700,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Sign Out',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Are you sure you want to sign out of your account?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    icon: Icons.close_rounded,
                    label: 'Cancel',
                    color: Colors.grey.shade100,
                    textColor: AppColors.textSecondary,
                    onTap: () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionButton(
                    icon: Icons.logout_rounded,
                    label: 'Sign Out',
                    color: Colors.red,
                    textColor: Colors.white,
                    onTap: () {
                      Navigator.pop(context);
                      widget.onLogout?.call();
                    },
                  ),
                ),
              ],
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }

  // --- Helpers ---

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }

  String _formatRole(String role) {
    switch (role.toUpperCase()) {
      case 'STUDENT':
        return 'Student';
      case 'LECTURER':
        return 'Lecturer';
      case 'ADMIN':
        return 'Administrator';
      default:
        return role;
    }
  }

  String _formatBirthday(String? birthday) {
    if (birthday == null || birthday.isEmpty) return 'Not provided';
    if (birthday.contains('T')) {
      return birthday.split('T').first;
    }
    if (birthday.contains(' ')) {
      return birthday.split(' ').first;
    }
    return birthday;
  }
}

// --- Data Models ---

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;

  _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });
}

// --- Action Button Widget ---

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: color != Colors.grey.shade100
                ? [
                    BoxShadow(
                      color: color.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: textColor, size: 20),
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
