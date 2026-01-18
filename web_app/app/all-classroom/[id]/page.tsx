"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, Button, TextInput, Spinner, Toast } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import useAxios from "@/hooks/useAxios"
import { Api } from "@/configs/api"

interface Classroom {
  id: string
  classCode: string
  className: string
  lecturerId: string
  subjectId: string
  subjectName: string
  semesterName: string
  createdDate: string
  endDate: string
}

export default function EnrollClassPage() {
    const { id } = useParams()
    const router = useRouter()
    const axiosInstance = useAxios()
    
    const [classroom, setClassroom] = useState<Classroom | null>(null)
    const [loading, setLoading] = useState(true)
    const [enrolKey, setEnrolKey] = useState("")
    const [enrolling, setEnrolling] = useState(false)
    const [error, setError] = useState("")

    // Hardcoded student ID for now
    const studentId = "6208c99e-601a-4550-a1d7-da3413fe852b"

    useEffect(() => {
        const fetchClassDetails = async () => {
            if (!id) return;
            try {
                setLoading(true)
                // Assuming GET_BY_ID is like /api/acas/v1/classrooms/{id}
                const res = await axiosInstance.get(`${Api.Classroom.GET_BY_ID}/${id}`)
                if (res.data?.dataResponse) {
                    setClassroom(res.data.dataResponse)
                }
            } catch (err) {
                console.error("Failed to fetch classroom details", err)
                setError("Không thể tải thông tin lớp học.")
            } finally {
                setLoading(false)
            }
        }

        fetchClassDetails()
    }, [id, axiosInstance])

    const handleEnroll = async () => {
        if (!enrolKey) {
            setError("Vui lòng nhập mã tham gia (Enrollment Key).")
            return
        }
        
        try {
            setEnrolling(true)
            setError("")
            
            const payload = {
                classId: id,
                studentId: studentId,
                enrolKey: enrolKey
            }

            await axiosInstance.post(Api.Classroom.ENROLL, payload)
            
            // Redirect on success
            router.push(`/my-classroom/${id}`)

        } catch (err: any) {
            console.error("Enrollment failed", err)
            // Handle error message from backend if available
            setError(err.response?.data?.message || "Tham gia lớp học thất bại. Vui lòng kiểm tra lại mã.")
        } finally {
            setEnrolling(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <HomeNavbar />
                <div className="flex-grow flex justify-center items-center">
                    <Spinner size="xl" color="info" />
                </div>
                <Footer />
            </div>
        )
    }

    if (!classroom) {
        return (
            <div className="min-h-screen flex flex-col">
                <HomeNavbar />
                <div className="flex-grow flex justify-center items-center">
                    <p className="text-gray-500">Lớp học không tồn tại.</p>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <HomeNavbar />

            <main className="flex-grow container mx-auto px-4 pt-24 pb-12 flex justify-center items-center">
                <Card className="w-full max-w-md shadow-lg rounded-2xl border-none">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                            Tham gia lớp học
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Nhập mã tham gia để vào lớp
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {classroom.className}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                            {classroom.classCode} - {classroom.semesterName}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                             <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                {classroom.lecturerId.substring(0,2).toUpperCase()}
                             </div>
                             <span>{classroom.lecturerId}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="enrolKey" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Mã tham gia (Enrollment Key)
                            </label>
                            <TextInput
                                id="enrolKey"
                                type="password"
                                placeholder="Nhập mã tham gia..."
                                value={enrolKey}
                                onChange={(e) => setEnrolKey(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <Button 
                            className="w-full bg-[#1F4E79] hover:bg-[#163A5C] dark:bg-[#C9A24D] dark:hover:bg-[#b08d42] text-white font-bold"
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
    )
}
