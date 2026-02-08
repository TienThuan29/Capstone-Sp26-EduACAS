"use client";

import { useState } from "react";
import { Button, Textarea, Label, Checkbox } from "flowbite-react";
import type { CreateTestCasePayload } from "@/hooks/problem/useProblem";

type TestcaseBlockProps = {
  isDark: boolean;
  onAdd: (testCase: CreateTestCasePayload) => void;
  onCancel: () => void;
};

const initialTestCase: CreateTestCasePayload = {
  inputData: "",
  expectedOutput: "",
  isPublic: true,
  isCaseInsensitive: false,
  isRemovedSpace: false,
};

export function TestcaseBlock({ isDark, onAdd, onCancel }: TestcaseBlockProps) {
  const [formData, setFormData] = useState<CreateTestCasePayload>(initialTestCase);

  const handleAdd = () => {
    if (!formData.expectedOutput.trim()) return;
    onAdd(formData);
    setFormData(initialTestCase);
  };

  return (
    <div
      className={`rounded-lg border p-4 ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
    >
      <h4
        className={`mb-4 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
      >
        New test case
      </h4>
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="tc-input"
            className={isDark ? "text-white" : "text-gray-900"}
          >
            Input data
          </Label>
          <Textarea
            id="tc-input"
            value={formData.inputData}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, inputData: e.target.value }))
            }
            placeholder="e.g. 1 2"
            rows={3}
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div>
          <Label
            htmlFor="tc-expected"
            className={isDark ? "text-white" : "text-gray-900"}
          >
            Expected output <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="tc-expected"
            value={formData.expectedOutput}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, expectedOutput: e.target.value }))
            }
            placeholder="e.g. 3"
            required
            rows={3}
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tc-public"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
            />
            <Label
              htmlFor="tc-public"
              className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Public (visible to students)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="tc-case-insensitive"
              checked={formData.isCaseInsensitive}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isCaseInsensitive: e.target.checked,
                }))
              }
            />
            <Label
              htmlFor="tc-case-insensitive"
              className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Case insensitive
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="tc-remove-space"
              checked={formData.isRemovedSpace}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isRemovedSpace: e.target.checked,
                }))
              }
            />
            <Label
              htmlFor="tc-remove-space"
              className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Ignore spaces
            </Label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            color="green"
            className="cursor-pointer"
            onClick={handleAdd}
          >
            Add to list
          </Button>
          <Button
            type="button"
            color="gray"
            onClick={onCancel}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
