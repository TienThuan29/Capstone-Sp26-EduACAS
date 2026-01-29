"use client";

import { Button, Card, Spinner } from "flowbite-react";
import type { Examination } from "@/hooks/exam/useExamination";

type ExamsTabProps = {
  examinations: Examination[];
  examsLoading: boolean;
  onCreateExam?: () => void;
};

export function ExamsTab({
  examinations,
  examsLoading,
  onCreateExam,
}: ExamsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="mb-8 border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
          Bài Kiểm Tra
        </h2>
        <Button
          className="bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]"
          onClick={onCreateExam}
        >
          + Tạo bài kiểm tra
        </Button>
      </div>

      {examsLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : examinations.length === 0 ? (
        <div className="rounded-4xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="cursor-default font-medium text-gray-500">
            Hiện tại chưa có bài kiểm tra nào cho lớp học này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examinations.map((exam) => {
            const startDate = new Date(exam.startDatetime);
            const endDate = new Date(exam.endDatetime);
            const durationMinutes = Math.round(
              (endDate.getTime() - startDate.getTime()) / 60000,
            );
            const isUpcoming = startDate > new Date();
            const isExpired = endDate < new Date();
            const isActive = !isUpcoming && !isExpired;

            return (
              <Card
                key={exam.id}
                className="rounded-3xl border border-gray-100 transition-all duration-300 hover:shadow-2xl dark:border-gray-700"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="line-clamp-2 text-lg font-bold text-gray-900 dark:text-white">
                      {exam.examName}
                    </h3>
                    {isActive && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 uppercase">
                        Đang diễn ra
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 uppercase">
                        Sắp tới
                      </span>
                    )}
                    {isExpired && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-700 uppercase">
                        Đã kết thúc
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-500">
                    {exam.description ||
                      "Không có mô tả cho bài kiểm tra này."}
                  </p>
                  <div className="space-y-2 border-t border-gray-50 pt-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Bắt đầu:</span>
                      <span className="font-bold">
                        {startDate.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian:</span>
                      <span className="font-bold">
                        {durationMinutes} phút
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" color="gray" className="flex-1">
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
