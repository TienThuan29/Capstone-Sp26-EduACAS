"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Tooltip,
} from "flowbite-react";
import {
  DocumentArrowDownIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import type { Material } from "@/types/material";
import { useMaterial } from "@/hooks/material/useMaterial";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/datetime-utils";
import { MaterialsSkeleton } from "@/components/ui/skeletons";

type MaterialsTabProps = {
  classId: string;
};

export function MaterialsTab({ classId }: MaterialsTabProps) {
  const { showSuccess, showError } = useToast();
  const { getMaterialsByClassroom } = useMaterial();
  const { getFileUrl } = usePrivateS3();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMaterialsByClassroom(classId);
      setMaterials(data);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      showError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [getMaterialsByClassroom, classId, showError]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDownload = async (material: Material) => {
    try {
      setDownloadingId(material.id);
      const url = await getFileUrl(material.filename);

      // Create temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = material.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      showError("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toUpperCase();
    return ext || "FILE";
  };

  if (loading) {
    return <MaterialsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
            Learning Materials
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and download class materials
          </p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800">
          <DocumentIcon className="mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No materials yet
          </h3>
          <p className="text-sm text-gray-500">
            The lecturer haưsn&apos;t uploaded any materials for this class yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>File Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Upload Date</TableHeadCell>
              <TableHeadCell>
                <span className="sr-only">Download</span>
              </TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell className="max-w-xs font-medium whitespace-nowrap text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <span className="truncate">{material.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {material.description || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge color="gray" className="inline-flex">
                      {getFileExtension(material.filename)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-gray-500">
                    {formatDate(material.createdDate)}
                  </TableCell>
                  <TableCell>
                    <Tooltip content="Download">
                      <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleDownload(material)}
                        disabled={downloadingId === material.id}
                      >
                        {downloadingId === material.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                            Download
                          </>
                        )}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
