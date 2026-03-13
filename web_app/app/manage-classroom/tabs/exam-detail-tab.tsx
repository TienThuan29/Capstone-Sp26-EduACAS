"use client";

import { Button, Tabs, TabItem } from "flowbite-react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Examination } from "@/types/examination";
import { OverviewTabContent } from "../components/exam-detail-tab/overview";
import { ProblemsTabContent } from "../components/exam-detail-tab/problems";
import { SubmissionsTabContent } from "../components/exam-detail-tab/submissions";

const STATUS_LABELS: Record<number, string> = {
  0: "PENDING",
  1: "ONGOING",
  2: "COMPLETED",
};

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export type ExaminationDetailViewProps = {
  examination: Examination;
  onBack: () => void;
  onExaminationUpdate?: (updated: Examination) => void;
  /** When false, back button is shown in page header instead of card (default true for backward compatibility) */
  showBackInHeader?: boolean;
};

export function ExaminationDetailView({
  examination,
  onBack,
  onExaminationUpdate,
  showBackInHeader = true,
}: ExaminationDetailViewProps) {
  const statusLabel =
    STATUS_LABELS[examination.status as 0 | 1 | 2] ?? "PENDING";
  const modeLabel = MODE_LABELS[examination.mode as 0 | 1] ?? "PRACTICAL";
  const problems = examination.problems ?? [];

  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        {showBackInHeader && (
          <Button
            color="gray"
            outline
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to list
          </Button>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {examination.examName}
        </h3>
      </div>
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        <Tabs>
          <TabItem title="Overview" active>
            <OverviewTabContent
              examination={examination}
              statusLabel={statusLabel}
              modeLabel={modeLabel}
            />
          </TabItem>
          <TabItem title="Problems">
            <ProblemsTabContent
              examination={examination}
              problems={problems}
              onExaminationUpdate={onExaminationUpdate}
            />
          </TabItem>
          <TabItem title="Submissions">
            <SubmissionsTabContent examination={examination} />
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}
