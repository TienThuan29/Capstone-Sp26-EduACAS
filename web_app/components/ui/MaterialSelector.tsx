"use client";

import { useState, useRef, useEffect } from "react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "flowbite-react";
import { Material } from "@/types/material";

type MaterialSelectorProps = {
  materials: Material[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
};

export function MaterialSelector({
  materials,
  selectedIds,
  onChange,
  loading = false,
}: MaterialSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMaterial = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeMaterial = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const selectedMaterials = materials.filter((m) => selectedIds.includes(m.id));

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-gray-200 hover:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span className="flex flex-wrap gap-1.5">
          {selectedMaterials.length === 0 ? (
            <span className="text-gray-500">Select materials...</span>
          ) : (
            selectedMaterials.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 rounded-md bg-[#1F4E79]/30 px-2 py-0.5 text-xs text-blue-300"
              >
                {m.filename}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMaterial(m.id);
                  }}
                  className="cursor-pointer text-blue-300 hover:text-blue-100"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" />
            </div>
          ) : materials.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No materials available in this classroom
            </div>
          ) : (
            <ul className="py-1">
              {materials.map((material) => {
                const isSelected = selectedIds.includes(material.id);
                return (
                  <li key={material.id}>
                    <button
                      type="button"
                      onClick={() => toggleMaterial(material.id)}
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-600"
                        }`}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{material.filename}</p>
                        {material.description && (
                          <p className="truncate text-xs text-gray-400">{material.description}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
