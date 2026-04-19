"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useThemeContext } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  TextInput,
  Badge,
  Pagination,
  Button,
  Tooltip,
  Modal,
  ModalHeader,
  ModalBody,
} from "flowbite-react";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { useAdminMaterial } from "@/hooks/material/useAdminMaterial";
import { Material, PagedMaterials } from "@/types/material";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/datetime-utils";
import { AdminMaterialsSkeleton } from "@/components/ui/skeletons"

const PAGE_SIZE = 10;

export default function AdminMaterialsPage() {
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { getAdminMaterials, softDeleteMaterial, restoreMaterial, loading } = useAdminMaterial();

  const [materialsData, setMaterialsData] = useState<PagedMaterials | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchMaterials = useCallback(async () => {
    const data = await getAdminMaterials(searchTerm, currentPage, PAGE_SIZE);
    if (data) {
      setMaterialsData(data);
    }
  }, [getAdminMaterials, searchTerm, currentPage]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(tempSearch);
    setCurrentPage(1);
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openDeleteModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMaterial) return;
    try {
      const success = await softDeleteMaterial(selectedMaterial.id);
      if (success) {
        toast.showSuccess("Material deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedMaterial(null);
        fetchMaterials();
      } else {
        toast.showError("Failed to delete material");
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Cannot delete material!");
    }
  };

  const handleRestore = async (material: Material) => {
    try {
      const success = await restoreMaterial(material.id);
      if (success) {
        toast.showSuccess("Material restored successfully");
        fetchMaterials();
      } else {
        toast.showError("Failed to restore material");
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Cannot restore material!");
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {loading ? (
          <AdminMaterialsSkeleton />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Manage Materials
                </h1>
                <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Moderation center for all uploaded educational resources
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <form className="grow max-w-md flex gap-3" onSubmit={handleSearch}>
              <div className="flex-1">
                <TextInput
                  type="text"
                  placeholder="Search by filename or description..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  icon={MagnifyingGlassIcon}
                  className="w-full"
                />
              </div>
              <Button type="submit" color="blue">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <Button color="gray" onClick={() => { setCurrentPage(1); fetchMaterials(); }} title="Refresh">
                <ArrowPathIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Filename</TableHeadCell>
                  <TableHeadCell>Lecturer</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell className="text-center">Upload Date</TableHeadCell>
                  <TableHeadCell className="text-center">Status</TableHeadCell>
                  <TableHeadCell className="text-center">Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y-0">
                {loading && !materialsData ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Spinner size="xl" />
                      <div className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading materials...</div>
                    </TableCell>
                  </TableRow>
                ) : !materialsData || materialsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <InformationCircleIcon className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No materials found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  materialsData.items.map((item) => (
                    <TableRow key={item.id} className={isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                      <TableCell className={`max-w-xs truncate font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={item.filename}>{item.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{item.lecturerName}</span>
                          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.lecturerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <Tooltip content={item.description || "No description"}>
                          <span className={`truncate block italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {item.description || "—"}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell className={`text-center whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(item.createdDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge color={item.isDeleted ? 'failure' : 'success'} className="font-bold">
                            {item.isDeleted ? 'DELETED' : 'ACTIVE'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="xs"
                            color="info"
                            href={item.fileUrl}
                            target="_blank"
                            as="a"
                            rel="noopener noreferrer"
                            title="Download/View"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </Button>

                          {!item.isDeleted ? (
                            <Button
                              size="xs"
                              color="failure"
                              onClick={() => openDeleteModal(item)}
                              title="Soft delete material"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              color="success"
                              onClick={() => handleRestore(item)}
                              title="Restore material"
                            >
                              <ArrowUturnLeftIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && materialsData && materialsData.totalCount > 0 && (
            <>
              {Math.ceil(materialsData.totalCount / PAGE_SIZE) > 1 && (
                <div className="flex justify-center mt-6 py-4 border-t border-gray-100 dark:border-gray-700">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(materialsData.totalCount / PAGE_SIZE)}
                    onPageChange={onPageChange}
                    showIcons
                  />
                </div>
              )}

              <div className={`mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, materialsData.totalCount)} of {materialsData.totalCount} materials
              </div>
            </>
          )}
        </div>
          </>
        )}
      </main>

      <Modal
        show={isDeleteModalOpen}
        size="md"
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMaterial(null);
        }}
        popup
        theme={{
          root: {
            base: "fixed inset-x-0 bottom-0 z-[200] h-modal w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0 md:h-full",
          },
        }}
      >
        <ModalHeader />
        <ModalBody className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl`}>
          <div>
            <h3 className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Confirm delete
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Are you sure you want to delete this material{" "}
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                &quot;{selectedMaterial?.filename}&quot;
              </span>
              ?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleConfirmDelete}
                className="cursor-pointer px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center"
              >
                Delete material
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedMaterial(null);
                }}
                className={`cursor-pointer px-6 py-2.5 font-bold rounded-xl transition-colors ${isDark
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-[#374151] text-white hover:bg-gray-600"
                  }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
