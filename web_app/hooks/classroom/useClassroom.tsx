"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SubjectOption {
  id: string;
  subjectCode: string;
  subjectName: string;
  isDeleted: boolean;
}

export type UpdateClassroomPayload = {
  id: string;
  classCode: string;
  className: string;
  lecturerId: string | undefined;
  subjectId: string;
  semesterName: string;
  enrolKey: string;
  endDate: string;
  maxSlot: number;
};

export const useClassroom = () => {
  const axiosInstance = useAxios();

  const getAllClassrooms = useCallback(
    async (userId?: string, search?: string, status?: string, pageIndex: number = 1, pageSize: number = 10) => {
      let url = `${Api.Classroom.GET_ALL_CLASSROOMS}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
      if (userId) {
        url += `&userId=${encodeURIComponent(userId)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      const response = await axiosInstance.get(url);
      console.log(response.data);
      return (
        response.data?.dataResponse || {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        }
      );
    },
    [axiosInstance],
  );

  const getStudentClassrooms = useCallback(
    async (
      studentId: string,
      status?: string,
      search?: string,
      pageIndex: number = 1,
      pageSize: number = 10,
    ) => {
      let url = `${Api.Classroom.GET_STUDENT_CLASSROOMS}/${studentId}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await axiosInstance.get(url);
      return (
        response.data?.dataResponse || {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        }
      );
    },
    [axiosInstance],
  );

  const getRecentClassroomIds = useCallback(
    async (userId: string, limit: number = 5) => {
      const response = await axiosInstance.get(
        Api.Classroom.GET_STUDENT_RECENT(userId),
        { params: { limit } },
      );
      return (response.data?.dataResponse ?? []) as string[];
    },
    [axiosInstance],
  );

  const recordClassroomAccess = useCallback(
    async (userId: string, classroomId: string) => {
      await axiosInstance.post(Api.Classroom.RECORD_RECENT_ACCESS(userId), {
        classroomId,
      });
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

  const getLecturerClassrooms = useCallback(
    async (
      lecturerId: string,
      search?: string,
      pageIndex: number = 1,
      pageSize: number = 10,
    ) => {
      let url = `${Api.Classroom.GET_LECTURER_CLASSROOMS}/${lecturerId}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await axiosInstance.get(url);
      return (
        response.data?.dataResponse || {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        }
      );
    },
    [axiosInstance],
  );

  const getSubjects = useCallback(async (): Promise<SubjectOption[]> => {
    const response = await axiosInstance.get(Api.Subject.GET_ALL);
    const all: SubjectOption[] = response.data?.dataResponse || [];
    return all.filter((s) => !s.isDeleted);
  }, [axiosInstance]);

  const updateClassroom = useCallback(
    async (classroomId: string, payload: UpdateClassroomPayload) => {
      const response = await axiosInstance.put(
        Api.Classroom.UPDATE_CLASSROOM(classroomId),
        payload,
      );
      return response.data?.dataResponse;
    },
    [axiosInstance],
  );

  const createClassroom = useCallback(
    async (payload: any) => {
      const response = await axiosInstance.post(
        Api.Classroom.CREATE_CLASSROOM,
        payload,
      );
      return response.data?.dataResponse;
    },
    [axiosInstance],
  );

  const softDeleteClassroom = useCallback(
    async (classroomId: string) => {
      const response = await axiosInstance.patch(
        Api.Classroom.SOFT_DELETE_CLASSROOM(classroomId),
      );
      return response.data?.dataResponse;
    },
    [axiosInstance],
  );

  const regenerateEnrolKey = useCallback(
    async (classroomId: string) => {
      const response = await axiosInstance.post(
        Api.Classroom.REGENERATE_ENROL_KEY(classroomId),
      );
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getAllClassrooms,
    getStudentClassrooms,
    getRecentClassroomIds,
    recordClassroomAccess,
    getClassroomById,
    enrollClassroom,
    leaveClassroom,
    getLecturerClassrooms,
    getSubjects,
    updateClassroom,
    createClassroom,
    softDeleteClassroom,
    regenerateEnrolKey,
  };
};
