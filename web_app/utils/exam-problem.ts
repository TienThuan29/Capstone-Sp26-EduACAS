import type { Problem, TestCase } from "@/types/examination";
import type { ProblemResponse } from "@/types/problem";

/**
 * Map API ProblemResponse to examination Problem (adds examId, codeTemplate, normalizes testCases).
 */
export function toExamProblem(
  resp: ProblemResponse,
  examId: string,
  programmingLanguageId: string | undefined
): Problem {
  const codeTemplate =
    (programmingLanguageId && resp.codeTemplates?.[programmingLanguageId]) ??
    "";
  const difficulty =
    typeof resp.difficulty === "number"
      ? resp.difficulty
      : resp.difficulty === "EASY"
        ? 0
        : resp.difficulty === "MEDIUM"
          ? 1
          : 2;
  const testCases: TestCase[] = (resp.testCases ?? []).map((tc) => ({
    id: tc.id,
    inputData: tc.inputData,
    expectedOutput: tc.expectedOutput,
    isPublic: tc.isPublic,
    isCaseInsensitive: tc.isCaseInsensitive,
    isRemovedSpace: false,
  }));
  return {
    id: resp.id,
    examId,
    lecturerId: resp.lecturerId,
    title: resp.title,
    content: resp.content,
    fileName: resp.fileName,
    difficulty,
    codeTemplate,
    testCases,
    tags: resp.tags,
    createdDate: resp.createdDate,
    updatedDate: resp.updatedDate,
  };
}
