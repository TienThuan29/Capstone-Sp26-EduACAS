"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Spinner, Badge } from "flowbite-react";
import type { Examination } from "@/types/examination";

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

type ExamsTabProps = {
  examinations: Examination[];
  examsLoading: boolean;
  classId: string;
};

export function ExamsTab({
  examinations,
  examsLoading,
  classId,
}: ExamsTabProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="mb-8 border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
          Examinations
        </h2>
      </div>

      {examsLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : examinations.length === 0 ? (
        <div className="rounded-4xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="cursor-default font-medium text-gray-500">
            There are no examinations for this class currently.
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
            const modeLabel = MODE_LABELS[exam.mode as 0 | 1] ?? "PRACTICAL";
            const problemCount = exam.examProblems?.length ?? 0;

            return (
              <Card
                key={exam.id}
                className="rounded-xs border border-gray-100 transition-all duration-300 dark:border-gray-700"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="line-clamp-2 text-lg font-bold text-gray-900 dark:text-white">
                      {exam.examName}
                    </h3>
                    {isActive && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 uppercase">
                        Ongoing
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 uppercase">
                        Upcoming
                      </span>
                    )}
                    {isExpired && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-700 uppercase">
                        Ended
                      </span>
                    )}
                  </div>

                  {/* Mode & Language Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge color="info">{modeLabel}</Badge>
                    {exam.programmingLanguage && (
                      <Badge color="purple">
                        {exam.programmingLanguage.languageName}
                      </Badge>
                    )}
                    {exam.isPublicResult && (
                      <Badge color="success">Public Result</Badge>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm text-gray-500">
                    {exam.description ||
                      "There is no description for this examination."}
                  </p>

                  <div className="space-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
                    {exam.classroom && (
                      <div className="flex justify-between">
                        <span>Classroom:</span>
                        <span className="max-w-[60%] truncate font-bold">
                          {exam.classroom.className}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Start:</span>
                      <span className="font-bold">
                        {startDate.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>End:</span>
                      <span className="font-bold">
                        {endDate.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-bold">{durationMinutes} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Mark:</span>
                      <span className="font-bold">{exam.totalMark}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problems:</span>
                      <span className="font-bold">{problemCount}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="gray"
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        router.push(`/my-classroom/${classId}/exam/${exam.id}`)
                      }
                    >
                      Details
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
