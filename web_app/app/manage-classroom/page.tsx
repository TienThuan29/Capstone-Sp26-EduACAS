"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Button,
  Select,
  TextInput,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
} from "flowbite-react";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import { useSubject } from "@/hooks/subject/useSubject";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { CustomPagination } from "@/components/custom-pagination";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { formatDateOnly } from "@/utils/datetime-utils";
import { ManageClassroomPageSkeleton } from "@/components/ui/skeletons";

interface LecturerLite {
  lecturerId: string;
  fullname: string;
  email: string;
  avatarUrl: string;
}

interface SubjectLite {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
}

interface Classroom {
  id: string;
  classCode: string;
  className: string;
  lecturer: LecturerLite;
  subject: SubjectLite;
  semesterName: string;
  createdDate: string;
  endDate: string;
  maxSlot: number;
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  isDeleted: boolean;
}

interface Semester {
  id: string;
  semesterName: string;
  startDate: string;
  endDate: string;
}

type CreateClassroomFormData = {
  classCode: string;
  className: string;
  subjectId: string;
  semesterName: string;
  enrolKey: string;
  dateEnd: string;
  maxSlot: number | "";
  avgScoreThreshold: number;
  minExamCount: number;
};

// --- Page Component ---
export default function ManageClassroomPage() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const axiosInstance = useAxios();
  const { getActiveSubjects } = useSubject();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const semesters = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    const seasons = ["Spring", "Summer", "Fall"];

    const result: { id: string; semesterName: string }[] = [];
    years.forEach((year) => {
      seasons.forEach((season) => {
        result.push({
          id: `${season.toLowerCase()}-${year}`,
          semesterName: `${season} ${year}`,
        });
      });
    });
    return result;
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 9;
  const [openModal, setOpenModal] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState<CreateClassroomFormData>({
    classCode: "",
    className: "",
    subjectId: "",
    semesterName: semesters[0].semesterName,
    enrolKey: "",
    dateEnd: "",
    maxSlot: "",
    avgScoreThreshold: 0,
    minExamCount: 2,
  });

  const { getLecturerClassrooms } = useClassroom();

  const fetchClassrooms = async () => {
    let currentUserId = user?.id;

    if (!currentUserId) {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          currentUserId = parsed.id;
        } catch (e) {
          console.error("Error parsing user profile from local storage", e);
        }
      }
    }

    if (!currentUserId) return;

    try {
      if (isInitialLoad.current) {
        setLoading(true);
        isInitialLoad.current = false;
      }
      const data = await getLecturerClassrooms(
        currentUserId,
        searchQuery,
        currentPage,
        PAGE_SIZE,
      );
      setClassrooms(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch classrooms failed", err);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user?.id, currentPage, searchQuery]);

  useEffect(() => {
    if (openModal) {
      const fetchData = async () => {
        try {
          const activeSubjects = await getActiveSubjects();
          setSubjects(activeSubjects);

          if (activeSubjects.length > 0) {
            setFormData((prev: CreateClassroomFormData) => ({
              ...prev,
              subjectId: activeSubjects[0].id,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch form data", error);
          showError("Failed to load subjects list.");
        }
      };
      fetchData();
    }
  }, [openModal, getActiveSubjects, showError]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalLoading(true);
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

      if (!currentUserId) {
        showError(
          "Cannot find lecturer information. Please log in again.",
        );
        setModalLoading(false);
        return;
      }

      if (formData.className.length > 100) {
        showError("Class name cannot exceed 100 characters.");
        setModalLoading(false);
        return;
      }
      if (new Date(formData.dateEnd) <= new Date()) {
        showError("End date must be a future date.");
        setModalLoading(false);
        return;
      }

      const slotVal = Number(formData.maxSlot);
      if (!formData.maxSlot || isNaN(slotVal) || slotVal <= 1) {
        showError("Max Slot must be at least 2.");
        setModalLoading(false);
        return;
      }

      const payload = {
        classCode: formData.classCode,
        className: formData.className,
        lecturerId: currentUserId,
        subjectId: formData.subjectId,
        semesterName: formData.semesterName,
        enrolKey: formData.enrolKey,
        endDate: formData.dateEnd,
        maxSlot: slotVal,
        gradingSettings: {
          avgScoreThreshold: Number(formData.avgScoreThreshold) || 0,
          minExamCount: Number(formData.minExamCount) || 0,
        },
      };

      await axiosInstance.post(Api.Classroom.CREATE_CLASSROOM, payload);
      showSuccess("Classroom created successfully!");
      setOpenModal(false);
      fetchClassrooms();

      setFormData({
        classCode: "",
        className: "",
        subjectId: subjects[0]?.id || "",
        semesterName: semesters[0].semesterName,
        enrolKey: "",
        dateEnd: "",
        maxSlot: "",
        avgScoreThreshold: 0,
        minExamCount: 0,
      });
    } catch (error) {
      console.error("Create classroom failed", error);
      showError("Failed to create classroom. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredClassrooms = useMemo(() => {
    let result = [...classrooms];

    if (selectedSemesterFilter !== "All") {
      result = result.filter((c) => c.semesterName === selectedSemesterFilter);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdDate).getTime() -
            new Date(b.createdDate).getTime()
          );
        case "name_asc":
          return a.className.localeCompare(b.className);
        case "name_desc":
          return b.className.localeCompare(a.className);
        default:
          return 0;
      }
    });

    return result;
  }, [classrooms, selectedSemesterFilter, sortBy]);

  const semestersForFilter = useMemo(() => {
    const unique = new Set(classrooms.map((c) => c.semesterName));
    return ["All", ...Array.from(unique)];
  }, [classrooms]);

  if (loading) {
    return <ManageClassroomPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 pb-12 min-h-[600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Classroom Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              List of classrooms you are responsible for
            </p>
          </div>
          <DefaultCustomButton
            label="+ Create new classroom"
            onClick={() => setOpenModal(true)}
          />
        </div>

        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex gap-2 md:col-span-2">
              <TextInput
                id="search"
                type="text"
                placeholder="Search by classroom name or code..."
                required
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                icon={() => (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                )}
                className="flex-1"
              />
              <button
                onClick={handleSearchSubmit}
                className="flex items-center gap-1.5 rounded-lg border border-transparent bg-[#1F4E79] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90 cursor-pointer"
              >
                Search
              </button>
            </div>

            <div>
              <Select
                value={selectedSemesterFilter}
                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              >
                {semestersForFilter.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem === "All" ? "All semesters" : sem}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {filteredClassrooms.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No classroom found.
            </div>
          ) : (
            <>
              {/* List header (desktop) */}
              <div className="hidden grid-cols-5 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wider text-gray-600 uppercase md:grid dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400">
                <div>Classroom code / Classroom name</div>
                <div>Subject</div>
                <div>Semester</div>
                <div>Time</div>
                <div className="text-right">Action</div>
              </div>
              {/* List rows */}
              {filteredClassrooms.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-gray-50 md:grid-cols-5 md:items-center md:gap-4 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div className="grid grid-cols-2 gap-2 md:items-center">
                    <span className="w-fit rounded-full bg-gradient-to-r from-[#1F4E79] to-[#C9A24D] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {c.classCode}
                    </span>
                    <span className="text-sm font-bold text-gray-900 md:font-semibold dark:text-white">
                      {c.className}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="md:hidden">Subject: </span>
                    {c.subject.subjectName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="md:hidden">Semester: </span>
                    {c.semesterName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="md:hidden">Time: </span>
                    {formatDateOnly(c.createdDate)} –{" "}
                    {formatDateOnly(c.endDate)}
                  </div>
                  <div className="flex justify-end pt-2 md:pt-0">
                    <Link href={`/manage-classroom/${c.id}`}>
                      <Button
                        color="gray"
                        size="sm"
                        outline
                        className="cursor-pointer rounded-lg border-gray-300 font-semibold hover:!border-[#1F4E79] hover:!bg-[#1F4E79] hover:!text-white dark:border-gray-600 dark:hover:!border-[#C9A24D] dark:hover:!bg-[#C9A24D] dark:hover:!text-white"
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      <div className="mb-12 flex justify-center">
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <Footer />

      <CreateClassroomModal
        show={openModal}
        onClose={() => setOpenModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateSubmit}
        modalLoading={modalLoading}
        subjects={subjects}
        semesters={semesters}
      />
    </div>
  );
}


// --- Create Classroom Modal Component ---
interface CreateClassroomModalProps {
  show: boolean;
  onClose: () => void;
  formData: CreateClassroomFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateClassroomFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  modalLoading: boolean;
  subjects: Subject[];
  semesters: { id: string; semesterName: string }[];
}

function CreateClassroomModal({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  modalLoading,
  subjects,
  semesters,
}: CreateClassroomModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Create new classroom</ModalHeader>
      <ModalBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="classCode">
                Classroom code <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="classCode"
              placeholder="Enter classroom code (e.g. SE123)"
              required
              value={formData.classCode}
              onChange={(e) =>
                setFormData({ ...formData, classCode: e.target.value })
              }
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="className">
                Classroom name <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="className"
              placeholder="Enter classroom name (e.g. Software Engineering)"
              required
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum 100 characters.
            </p>
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
            </div>
            <Select
              id="subject"
              required
              value={formData.subjectId}
              onChange={(e) =>
                setFormData({ ...formData, subjectId: e.target.value })
              }
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectCode} - {sub.subjectName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="semester">
                  Semester <span className="text-red-500">*</span>
                </Label>
              </div>
              <Select
                id="semester"
                required
                value={formData.semesterName}
                onChange={(e) =>
                  setFormData({ ...formData, semesterName: e.target.value })
                }
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.semesterName}>
                    {sem.semesterName}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="maxSlot">
                  Max Slot <span className="text-red-500">*</span>
                </Label>
              </div>
              <TextInput
                id="maxSlot"
                type="number"
                placeholder="Enter max slot (e.g. 30)"
                required
                value={formData.maxSlot}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxSlot:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                min={2}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="enrolKey">Enrol key</Label>
            </div>
            <TextInput
              id="enrolKey"
              placeholder=""
              type="password"
              value={formData.enrolKey}
              onChange={(e) =>
                setFormData({ ...formData, enrolKey: e.target.value })
              }
              pattern="^(?=.*[^a-zA-Z0-9])\S{6,20}$"
              title="EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces"
            />
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-500">
              <li>
                6-20 characters, must contain at least one special character,
                and must not contain spaces.
              </li>
              <li>
                If you don&apos;t want to set an enrol key, it is
                automatically generated.
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="dateEnd">
                End date of classroom <span className="text-red-500">*</span>
              </Label>
            </div>
            <TextInput
              id="dateEnd"
              type="date"
              required
              value={formData.dateEnd}
              onChange={(e) =>
                setFormData({ ...formData, dateEnd: e.target.value })
              }
            />
          </div>

          {/* <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Grading Settings
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="avgScoreThreshold">
                  Avg score threshold
                </Label>
                <TextInput
                  id="avgScoreThreshold"
                  type="number"
                  step={0.5}
                  min={0}
                  max={10}
                  value={formData.avgScoreThreshold || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avgScoreThreshold:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="mt-1"
                  placeholder="e.g. 5.0"
                />
              </div>
              <div>
                <Label htmlFor="minExamCount">
                  Min exam count
                </Label>
                <TextInput
                  id="minExamCount"
                  type="number"
                  min={2}
                  value={formData.minExamCount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minExamCount:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="mt-1"
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          </div> */}

          <div className="mt-6 flex justify-end gap-2">
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
            <DefaultCustomButton
              label={modalLoading ? "Creating..." : "Create classroom"}
              type="submit"
              disabled={modalLoading}
            />
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
