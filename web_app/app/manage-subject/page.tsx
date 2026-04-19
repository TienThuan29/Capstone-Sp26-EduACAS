"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  TextInput,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Textarea,
  Spinner,
  Select,
} from "flowbite-react";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  PencilIcon as HiPencil,
  TrashIcon as HiTrash,
  PlusIcon as HiPlus,
  EyeIcon as HiEye,
} from "@heroicons/react/24/solid";
import { formatDateOnly } from "@/utils/datetime-utils";

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  description: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;
  isDeleted: boolean;
}

export default function ManageSubjectPage() {
  const { showSuccess, showError } = useToast();
  const axiosInstance = useAxios();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    description: "",
  });

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewDescription, setViewDescription] = useState("");
  const [viewSubjectName, setViewSubjectName] = useState("");

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(Api.Subject.GET_ALL);
      if (res.data?.dataResponse) {
        const allSubjects: Subject[] = res.data.dataResponse;
        setSubjects(allSubjects);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error("Fetch subjects failed", err);
      showError("Cannot load subject list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [axiosInstance]);

  const filteredSubjects = useMemo(() => {
    let result = subjects;

    if (statusFilter !== "all") {
      const isDeleting = statusFilter === "deleted";
      result = result.filter((s) => s.isDeleted === isDeleting);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.subjectCode.toLowerCase().includes(lowerTerm) ||
          s.subjectName.toLowerCase().includes(lowerTerm),
      );
    }

    return result;
  }, [subjects, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setFormData({
      subjectCode: "",
      subjectName: "",
      description: "",
    });
    setIsEditing(false);
    setCurrentSubjectId(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      description: subject.description,
    });
    setIsEditing(true);
    setCurrentSubjectId(subject.id);
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let currentUserId = user?.id;
    if (!currentUserId) {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          currentUserId = parsed.id;
        } catch (e) {
          console.error("Error parsing user profile", e);
        }
      }
    }

    if (!currentUserId && !isEditing) {
      showError("Cannot find user information. Please login again.");
      return;
    }

    try {
      setActionLoading(true);
      if (isEditing && currentSubjectId) {
        const payload = {
          id: currentSubjectId,
          subjectCode: formData.subjectCode,
          subjectName: formData.subjectName,
          description: formData.description,
        };
        await axiosInstance.put(
          `${Api.Subject.UPDATE(currentSubjectId)}`,
          payload,
        );
        showSuccess("Update subject successfully");
      } else {
        const payload = {
          subjectCode: formData.subjectCode,
          subjectName: formData.subjectName,
          description: formData.description,
          createdBy: currentUserId,
        };
        await axiosInstance.post(Api.Subject.CREATE, payload);
        showSuccess("Create subject successfully");
      }
      setOpenModal(false);
      fetchSubjects();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Submit subject failed", error);
      const errorMsg =
        error.response?.data?.message ||
        (isEditing ? "Update subject failed" : "Create subject failed");
      showError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      setActionLoading(true);
      await axiosInstance.patch(
        `${Api.Subject.SOFT_DELETE(subjectToDelete.id)}`,
      );
      showSuccess("Delete subject successfully");
      setOpenDeleteModal(false);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (error) {
      console.error("Delete subject failed", error);
      showError("Delete subject failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDescription = (subject: Subject) => {
    setViewDescription(subject.description);
    setViewSubjectName(subject.subjectName);
    setOpenViewModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNavbar />
        <div className="flex flex-grow items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 pb-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Subject Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage subjects in the system
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] focus:ring-4 focus:ring-blue-300 enabled:hover:bg-gradient-to-l dark:focus:ring-blue-800"
            onClick={handleOpenCreate}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Create New Subject
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="max-w-md flex-grow">
            <TextInput
              id="search"
              type="text"
              placeholder="Search by name or subject code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={() => (
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </Select>
          </div>
        </div>

        <div className="relative overflow-x-auto sm:rounded-lg">
          <Table hoverable>
            <TableHead>
              <TableRow>
                <TableHeadCell className="text-center">
                  Subject Code
                </TableHeadCell>
                <TableHeadCell className="text-center">
                  Subject Name
                </TableHeadCell>
                <TableHeadCell className="text-center">
                  Description
                </TableHeadCell>
                <TableHeadCell className="text-center">Status</TableHeadCell>
                <TableHeadCell className="text-center">
                  Created Date
                </TableHeadCell>
                <TableHeadCell className="text-center">
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No subjects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => (
                  <TableRow
                    key={subject.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <TableCell className="text-center font-medium whitespace-nowrap text-gray-900 dark:text-white">
                      {subject.subjectCode}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.subjectName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="xs"
                        color="light"
                        onClick={() => handleViewDescription(subject)}
                        className="mx-auto border-none focus:ring-0"
                      >
                        <HiEye className="h-5 w-5 text-gray-500 transition-colors hover:text-blue-600" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.isDeleted ? (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                          Deleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDateOnly(subject.createdDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleOpenEdit(subject)}
                        >
                          <HiPencil className="h-5 w-5 text-blue-600" />
                        </Button>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleDeleteClick(subject)}
                          disabled={subject.isDeleted}
                          className={
                            subject.isDeleted
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }
                        >
                          <HiTrash
                            className={`h-5 w-5 ${subject.isDeleted ? "text-gray-400" : "text-red-600"}`}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Footer />

      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <ModalHeader>
          {isEditing ? "Edit Subject" : "Create New Subject"}
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="subjectCode">
                  Subject Code <span className="text-red-500">*</span>
                </Label>
              </div>
              <TextInput
                id="subjectCode"
                placeholder="VD: SWP490"
                required
                value={formData.subjectCode}
                onChange={(e) =>
                  setFormData({ ...formData, subjectCode: e.target.value })
                }
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="subjectName">
                  Subject Name <span className="text-red-500">*</span>
                </Label>
              </div>
              <TextInput
                id="subjectName"
                placeholder="VD: Software Project"
                required
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData({ ...formData, subjectName: e.target.value })
                }
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="description">Description</Label>
              </div>
              <Textarea
                id="description"
                placeholder="Description of the subject..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button color="gray" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]"
              >
                {actionLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      <Modal
        show={openDeleteModal}
        size="md"
        onClose={() => setOpenDeleteModal(false)}
        popup
      >
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200">
              <HiTrash className="h-10 w-10" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Are you sure you want to delete subject{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                &quot;{subjectToDelete?.subjectName}&quot;
              </span>
              ?
              <br />
              This action will change the status to &quot;Deleted&quot;.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color="failure"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-4"
              >
                {actionLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  "Delete Subject"
                )}
              </Button>
              <Button
                color="gray"
                onClick={() => setOpenDeleteModal(false)}
                className="px-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={openViewModal} onClose={() => setOpenViewModal(false)}>
        <ModalHeader>Subject Description: {viewSubjectName}</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-500 dark:text-gray-400">
              {viewDescription || "No description available for this subject."}
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="gray" onClick={() => setOpenViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
