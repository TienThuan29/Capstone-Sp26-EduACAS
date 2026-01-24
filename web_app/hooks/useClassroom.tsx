"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

export interface LecturerLite {
  lecturerId: string;
  lecturerName: string;
}

export interface SubjectLite {
  subjectId: string;
  subjectName: string;
}

export interface Enrollment {
  isJoining: boolean;
  joinedDate: string;
  movedOutDate: string | null;
}

export interface Classroom {
  id: string;
  classCode: string;
  className: string;
  lecturer: LecturerLite;
  subject: SubjectLite;
  semesterName: string;
  enrolKey: string;
  createdDate: string;
  updatedDate: string | null;
  endDate: string;
  isDeleted: boolean;
  enrollment?: Enrollment;
}

export const useClassroom = () => {
  const axiosInstance = useAxios();

  const getAllClassrooms = useCallback(async (userId?: string) => {
    const url = userId
      ? `${Api.Classroom.GET_ALL_CLASSROOMS}?userId=${userId}`
      : Api.Classroom.GET_ALL_CLASSROOMS;
    const response = await axiosInstance.get(url);
    return response.data?.dataResponse || [];
  }, [axiosInstance]);

  const getStudentClassrooms = useCallback(
    async (studentId: string) => {
      const response = await axiosInstance.get(
        `${Api.Classroom.GET_STUDENT_CLASSROOMS}/${studentId}`,
      );
      return response.data?.dataResponse || [];
    },
    [axiosInstance],
  );

  const getClassroomById = useCallback(
    async (classId: string, userId?: string) => {
      const url = userId
        ? `${Api.Classroom.GET_BY_ID}/${classId}?userId=${userId}`
        : `${Api.Classroom.GET_BY_ID}/${classId}`;
      const response = await axiosInstance.get(url);
      return response.data?.dataResponse || null;
    },
    [axiosInstance],
  );

  const enrollClassroom = useCallback(
    async (payload: {
      classId: string;
      studentId: string;
      enrolKey: string;
    }) => {
      const response = await axiosInstance.post(Api.Classroom.ENROLL, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const leaveClassroom = useCallback(
    async (payload: {
      classId: string;
      studentId: string;
      enrolKey?: string;
    }) => {
      const response = await axiosInstance.put(Api.Classroom.LEAVE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getAllClassrooms,
    getStudentClassrooms,
    getClassroomById,
    enrollClassroom,
    leaveClassroom,
  };
};
