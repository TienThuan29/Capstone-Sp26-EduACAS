import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/material.dart' as model;
import 'package:mobile/features/services/material_service.dart';
import 'package:url_launcher/url_launcher.dart';

class MaterialsTab extends StatefulWidget {
  final String classroomId;

  const MaterialsTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<MaterialsTab> createState() => _MaterialsTabState();
}

class _MaterialsTabState extends State<MaterialsTab> {
  List<model.Material> _materials = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isUploading = false;
  File? _selectedFile;
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadMaterials();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadMaterials() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final materials =
          await MaterialService.getMaterialsByClassroom(widget.classroomId);
      setState(() {
        _materials = materials;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _viewMaterial(model.Material material) async {
    try {
      // Show loading dialog
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // Get the file URL
      final fileUrl =
          await MaterialService.getPrivateFileUrl(material.filename);

      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      final extension = material.filename.split('.').last.toLowerCase();
      final officeExtensions = {
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
      };

      final uri = officeExtensions.contains(extension)
          ? Uri.parse(
              'https://docs.google.com/gview?embedded=1&url=${Uri.encodeComponent(fileUrl)}',
            )
          : Uri.parse(fileUrl);

      // Prefer in-app browser for "View" behavior.
      var opened = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
      if (!opened) {
        opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      }

      if (!opened && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open file. Please install a browser or file viewer app.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog if still open
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _showUploadDialog() async {
    _selectedFile = null;
    _descriptionController.clear();

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Upload Material'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _isUploading
                          ? null
                          : () async {
                              final result = await FilePicker.platform.pickFiles(
                                type: FileType.any,
                              );

                              if (result != null &&
                                  result.files.isNotEmpty &&
                                  result.files.single.path != null) {
                                setDialogState(() {
                                  _selectedFile = File(result.files.single.path!);
                                });
                              }
                            },
                      icon: const Icon(Icons.attach_file),
                      label: const Text('Select file'),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _selectedFile == null
                          ? 'No file selected'
                          : 'Selected: ${_selectedFile!.uri.pathSegments.last}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _descriptionController,
                      enabled: !_isUploading,
                      minLines: 2,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Description (optional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: _isUploading ? null : () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: (_isUploading || _selectedFile == null)
                      ? null
                      : () async {
                          final rootMessenger = ScaffoldMessenger.of(this.context);

                          setDialogState(() {
                            _isUploading = true;
                          });

                          try {
                            final lecturerId = await TokenStorage.getUserId();
                            if (lecturerId == null || lecturerId.isEmpty) {
                              throw Exception('Cannot determine lecturer ID');
                            }

                            await MaterialService.createMaterial(
                              classroomId: widget.classroomId,
                              lecturerId: lecturerId,
                              file: _selectedFile!,
                              description: _descriptionController.text.trim(),
                            );

                            if (!context.mounted) return;
                            Navigator.pop(context);
                            rootMessenger.showSnackBar(
                              const SnackBar(
                                content: Text('Material uploaded successfully'),
                                backgroundColor: AppColors.success,
                              ),
                            );
                            await _loadMaterials();
                          } catch (e) {
                            if (!context.mounted) return;
                            rootMessenger.showSnackBar(
                              SnackBar(
                                content: Text('Error uploading material: $e'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          } finally {
                            if (mounted) {
                              setDialogState(() {
                                _isUploading = false;
                              });
                            }
                          }
                        },
                  child: _isUploading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Upload'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _confirmDelete(model.Material material) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Material'),
        content: Text('Are you sure you want to delete "${material.filename}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _deleteMaterial(material);
    }
  }

  Future<void> _deleteMaterial(model.Material material) async {
    try {
      await MaterialService.deleteMaterial(material.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Material deleted successfully'),
          backgroundColor: AppColors.success,
        ),
      );
      _loadMaterials();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error deleting material: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            const Text(
              'Error loading materials',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: AppColors.textLight),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadMaterials,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_materials.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.folder_open_rounded, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text(
              'No materials found',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            const Text(
              'No materials have been uploaded yet',
              style: TextStyle(color: AppColors.textLight),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showUploadDialog,
              icon: const Icon(Icons.cloud_upload_rounded),
              label: const Text('Upload Material'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        const GradientBackground(),
        Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Classroom Materials',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  _buildAddButton(),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadMaterials,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _materials.length,
                  itemBuilder: (context, index) {
                    final material = _materials[index];
                    return _buildMaterialCard(material);
                  },
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAddButton() {
    return Material(
      color: AppColors.primary.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: _showUploadDialog,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          child: const Icon(Icons.add_rounded, color: AppColors.primary, size: 24),
        ),
      ),
    );
  }

  Widget _buildMaterialCard(model.Material material) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _viewMaterial(material),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          _getFileIcon(material.filename),
                          color: AppColors.primary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              material.filename,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.access_time_rounded, size: 12, color: AppColors.textLight),
                                const SizedBox(width: 4),
                                Text(
                                  _formatDate(material.createdDate),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textLight),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => _confirmDelete(material),
                        icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  if (material.description.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      material.description,
                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getFileIcon(String filename) {
    final extension = filename.split('.').last.toLowerCase();
    switch (extension) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'xls':
      case 'xlsx':
        return Icons.table_chart;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Icons.image;
      case 'zip':
      case 'rar':
        return Icons.folder_zip;
      default:
        return Icons.insert_drive_file;
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }
}
