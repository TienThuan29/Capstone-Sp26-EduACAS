"use client";

import { useState } from "react";
import { Button, Tabs, TabItem } from "flowbite-react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Examination, ExaminationStatus, ExaminationMode } from "@/types/examination";
import { OverviewTabContent } from "../components/exam-detail-tab/overview";
import { ProblemsTabContent } from "../components/exam-detail-tab/problems";
import { SubmissionsTabContent } from "../components/exam-detail-tab/submissions";
import { SimilarityTabContent } from "../components/exam-detail-tab/similarity";
import { ExamSessionTabContent } from "../components/exam-detail-tab/exam-session";

const STATUS_LABELS: Record<ExaminationStatus, string> = {
  PENDING: "PENDING",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
};

const MODE_LABELS: Record<ExaminationMode, string> = {
  PRACTICAL: "PRACTICAL",
  EXAMINATION: "EXAMINATION",
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

const TAB_OVERVIEW = 0;
const TAB_PROBLEMS = 1;
const TAB_SUBMISSIONS = 2;
const TAB_SIMILARITY = 3;
const TAB_SESSIONS = 4;

export function ExaminationDetailView({
  examination,
  onBack,
  onExaminationUpdate,
  showBackInHeader = true,
}: ExaminationDetailViewProps) {
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const statusLabel = STATUS_LABELS[examination.status] ?? "PENDING";
  const modeLabel = MODE_LABELS[examination.mode] ?? "PRACTICAL";
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
        <Tabs onActiveTabChange={setActiveTab}>
          <TabItem title="Overview" active={activeTab === TAB_OVERVIEW}>
            {activeTab === TAB_OVERVIEW && (
              <OverviewTabContent
                examination={examination}
                statusLabel={statusLabel}
                modeLabel={modeLabel}
              />
            )}
          </TabItem>
          <TabItem title="Problems" active={activeTab === TAB_PROBLEMS}>
            {activeTab === TAB_PROBLEMS && (
              <ProblemsTabContent
                examination={examination}
                problems={problems}
                onExaminationUpdate={onExaminationUpdate}
              />
            )}
          </TabItem>
          <TabItem title="Submissions" active={activeTab === TAB_SUBMISSIONS}>
            {activeTab === TAB_SUBMISSIONS && (
              <SubmissionsTabContent examination={examination} />
            )}
          </TabItem>
          <TabItem title="Similarity" active={activeTab === TAB_SIMILARITY}>
            {activeTab === TAB_SIMILARITY && (
              <SimilarityTabContent examination={examination} />
            )}
          </TabItem>
          <TabItem title="Sessions" active={activeTab === TAB_SESSIONS}>
            {activeTab === TAB_SESSIONS && (
              <ExamSessionTabContent examination={examination} />
            )}
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}
