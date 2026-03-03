"use client";

import { useParams } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ProblemForm } from "../../components/problem-form";

export default function EditProblemPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;

  return (
    <ProblemForm
      mode="edit"
      problemId={id}
      headerTitle="Edit Problem"
      headerSubtitle="Update the coding problem details"
      submitButtonLabel="Update Problem"
      submitButtonIcon={<CheckIcon className="mr-2 h-5 w-5" />}
      extractedContentHelperText="Review and edit the extracted content before updating the problem"
    />
  );
}
