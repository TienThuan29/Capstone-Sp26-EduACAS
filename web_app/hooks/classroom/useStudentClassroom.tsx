"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { ClassroomStudentResponse } from "@/types/classroom";

export const useStudentClassroom = () => {
  const axiosInstance = useAxios();

  const getStudentsByClassId = useCallback(
    async (classId: string): Promise<ClassroomStudentResponse[]> => {
      const response = await axiosInstance.get(
        Api.Classroom.GET_CLASSROOM_STUDENTS(classId),
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance],
  );

  const forceLeaveStudent = useCallback(
    async (classId: string, studentId: string) => {
      const response = await axiosInstance.put(
        Api.Classroom.FORCE_LEAVE(classId, studentId),
      );
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getStudentsByClassId,
    forceLeaveStudent,
  };
};
