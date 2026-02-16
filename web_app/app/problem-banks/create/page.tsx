"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { ProblemForm } from "../components/problem-form";

export default function CreateProblemPage() {
  return (
    <ProblemForm
      mode="create"
      headerTitle="Create New Problem"
      headerSubtitle="Contribute to the problem bank"
      submitButtonLabel="Create Problem"
      submitButtonIcon={<PlusIcon className="mr-2 h-5 w-5" />}
      extractedContentHelperText="Review and edit the extracted content before creating the problem"
    />
  );
}
