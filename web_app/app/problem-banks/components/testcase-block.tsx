"use client";

import { useState } from "react";
import { Button, Textarea, Label, Checkbox, TextInput } from "flowbite-react";
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
  isFloatingPoint: false,
  floatingPointTolerance: null,
  decimalPlaces: null,
  isTokenComparision: false,
  isNotOrderedComparision: false,
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
      <h2
        className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
      >
        New test case
      </h2>
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
        <div className="space-y-3">
          <div className="space-y-3">
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
                id="tc-token-comparison"
                checked={formData.isTokenComparision !== null ? formData.isTokenComparision : false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isTokenComparision: e.target.checked,
                  }))
                }
              />
              <Label
                htmlFor="tc-token-comparison"
                className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Token comparison
              </Label>
            </div>
            {formData.isTokenComparision && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tc-not-ordered-comparison"
                  checked={formData.isNotOrderedComparision ?? false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isNotOrderedComparision: e.target.checked,
                    }))
                  }
                />
                <Label
                  htmlFor="tc-not-ordered-comparison"
                  className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Not ordered comparison (not care about order between tokens)
                </Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="tc-floating-point"
                checked={formData.isFloatingPoint}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isFloatingPoint: e.target.checked,
                  }))
                }
              />
              <Label
                htmlFor="tc-floating-point"
                className={`cursor-pointer ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Floating point comparison
              </Label>
            </div>
            
            
          </div>
          {formData.isFloatingPoint && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="tc-tolerance"
                  className={isDark ? "text-white" : "text-gray-900"}
                >
                  Floating Point Tolerance
                </Label>
                <TextInput
                  id="tc-tolerance"
                  type="number"
                  step="0.0001"
                  value={formData.floatingPointTolerance !== null ? formData.floatingPointTolerance.toString() : "0.0001"}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      floatingPointTolerance: val,
                    }));
                  }}
                  placeholder="0.0001"
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <Label
                  htmlFor="tc-decimal-places"
                  className={isDark ? "text-white" : "text-gray-900"}
                >
                  Decimal Places
                </Label>
                <TextInput
                  id="tc-decimal-places"
                  type="number"
                  min="0"
                  value={formData.decimalPlaces !== null ? formData.decimalPlaces.toString() : "2"}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2;
                    setFormData((prev) => ({
                      ...prev,
                      decimalPlaces: val,
                    }));
                  }}
                  placeholder="2"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}
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
