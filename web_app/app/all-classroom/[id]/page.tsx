"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, TextInput, Spinner } from "flowbite-react";
import HomeNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import { useClassroom, Classroom } from "@/hooks/classroom/useClassroom";

export default function EnrollClassPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getClassroomById, enrollClassroom } = useClassroom();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolKey, setEnrolKey] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const studentId = user?.id;

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getClassroomById(id as string);
        if (data) {
          setClassroom(data);
        }
      } catch (err) {
        console.error("Failed to fetch classroom details", err);
        setError("Không thể tải thông tin lớp học.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [id, getClassroomById]);

  const handleEnroll = async () => {
    if (!enrolKey) {
      setError("Vui lòng nhập mã tham gia (Enrollment Key).");
      return;
    }

    try {
      setEnrolling(true);
      setError("");

      const payload = {
        classId: id as string,
        studentId: studentId!,
        enrolKey: enrolKey,
      };

      await enrollClassroom(payload);

      router.push(`/my-classroom/${id}`);
    } catch (err: any) {
      console.error("Enrollment failed", err);
      setError(
        err.response?.data?.message ||
          "Tham gia lớp học thất bại. Vui lòng kiểm tra lại mã.",
      );
    } finally {
      setEnrolling(false);
    }
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

  if (!classroom) {
    return (
      <div className="flex min-h-screen flex-col">
        <HomeNavbar />
        <div className="flex flex-grow items-center justify-center">
          <p className="text-gray-500">Lớp học không tồn tại.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <HomeNavbar />

      <main className="container mx-auto flex flex-grow items-center justify-center px-4 pt-24 pb-12">
        <Card className="w-full max-w-md rounded-2xl border-none">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
              Tham gia lớp học
            </h2>
            <p className="text-sm text-gray-500">Nhập mã tham gia để vào lớp</p>
          </div>

          <div className="mb-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              {classroom.className}
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              {classroom.classCode} - {classroom.semesterName}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
                {classroom.lecturer.lecturerName.substring(0, 2).toUpperCase()}
              </div>
              <span>{classroom.lecturer.lecturerName}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="enrolKey"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Mã tham gia (Enrollment Key)
              </label>
              <TextInput
                id="enrolKey"
                type="password"
                placeholder="Nhập mã tham gia..."
                value={enrolKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEnrolKey(e.target.value)
                }
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              className="w-full bg-[#1F4E79] font-bold text-white hover:bg-[#163A5C] dark:bg-[#C9A24D] dark:hover:bg-[#b08d42]"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <>
                  <Spinner size="sm" light className="mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Tham gia ngay"
              )}
            </Button>

            <Button
              color="gray"
              className="w-full"
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
