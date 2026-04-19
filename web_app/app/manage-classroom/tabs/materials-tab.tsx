"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  FileInput,
  Textarea,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Tooltip,
} from "flowbite-react";
import {
  PlusIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import MaterialPreviewDrawer from "@/components/ui/MaterialPreviewDrawer";
import type { Material } from "@/types/material";
import { useMaterial } from "@/hooks/material/useMaterial";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/datetime-utils";
import { MaterialsTabSkeleton } from "@/components/ui/skeletons";

type MaterialsTabProps = {
  classId: string;
};

export function MaterialsTab({ classId }: MaterialsTabProps) {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const { getMaterialsByClassroom, createMaterial, deleteMaterial } = useMaterial();
  const { getFileUrl } = usePrivateS3();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    description: "",
  });

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMaterialsByClassroom(classId);
      setMaterials(data);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      showError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [getMaterialsByClassroom, classId, showError]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openUpload = () => {
    setUploadData({ file: null, description: "" });
    setOpenUploadModal(true);
  };

  const openDeleteConfirm = (material: Material) => {
    setMaterialToDelete(material);
    setOpenDeleteModal(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) {
      showError("Please select a file");
      return;
    }
    try {
      setActionLoading(true);
      // Use current user's ID as the uploader
      if (!user?.id) {
        showError("Cannot determine user ID");
        return;
      }
      
      await createMaterial({
        classroomId: classId,
        lecturerId: user.id,
        description: uploadData.description,
        file: uploadData.file,
      });
      showSuccess("Material uploaded successfully");
      setOpenUploadModal(false);
      await fetchMaterials();
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : undefined;
      showError(msg || "Failed to upload material");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;
    try {
      setActionLoading(true);
      await deleteMaterial(materialToDelete.id);
      showSuccess("Material deleted successfully");
      setOpenDeleteModal(false);
      await fetchMaterials();
    } catch (error) {
      console.error("Delete failed:", error);
      showError("Failed to delete material");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      setDownloadingId(material.id);
      const url = await getFileUrl(material.filename);
      
      // Create temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = material.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      showError("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toUpperCase();
    return ext || "FILE";
  };

  if (loading) {
    return <MaterialsTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course Materials
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and share course materials with students
          </p>
        </div>
        <Button color="info" onClick={openUpload} className="bg-[#1F4E79] hover:bg-[#2A6BA3] text-white">
          <PlusIcon className="mr-2 h-5 w-5" />
          Upload Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800">
          <DocumentIcon className="mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No materials yet
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Upload your first course material to get started
          </p>
          <Button color="info" size="sm" onClick={openUpload} className="bg-[#1F4E79] hover:bg-[#2A6BA3] text-white">
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload Material
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>File Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Upload Date</TableHeadCell>
              <TableHeadCell>
                <span className="sr-only">Actions</span>
              </TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell className="max-w-xs whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <DocumentIcon className="h-5 w-5 shrink-0 text-gray-400" />
                      <button
                        onClick={() => setPreviewMaterial(material)}
                        className="truncate text-left hover:underline text-blue-600 dark:text-blue-400"
                        title="Preview file"
                      >
                        {material.filename}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {material.description || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge color="gray" className="inline-flex">
                      {getFileExtension(material.filename)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    {formatDate(material.createdDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Preview">
                        <Button
                          color="gray"
                          size="sm"
                          onClick={() => setPreviewMaterial(material)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Download">
                        <Button
                          color="gray"
                          size="sm"
                          onClick={() => handleDownload(material)}
                          disabled={downloadingId === material.id}
                        >
                          {downloadingId === material.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          color="red"
                          size="sm"
                          onClick={() => openDeleteConfirm(material)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload Modal */}
      <Modal show={openUploadModal} onClose={() => setOpenUploadModal(false)}>
        <ModalHeader>Upload Course Material</ModalHeader>
        <form onSubmit={handleUpload}>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="file">Select File *</Label>
                </div>
                <FileInput
                  id="file"
                  required
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload any document, PDF, slides, or code files
                </p>
                {uploadData.file && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {uploadData.file.name} (
                    {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="description">Description</Label>
                </div>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Describe this material (optional)"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              color="info"
              disabled={actionLoading || !uploadData.file}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
            >
              {actionLoading ? <Spinner size="sm" /> : "Upload"}
            </Button>
            <Button color="gray" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={openDeleteModal} onClose={() => setOpenDeleteModal(false)} size="md">
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {materialToDelete?.filename}
            </span>
            ? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="failure" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" /> : "Delete"}
          </Button>
          <Button color="gray" onClick={() => setOpenDeleteModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <MaterialPreviewDrawer
        material={previewMaterial}
        isOpen={previewMaterial !== null}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
}
