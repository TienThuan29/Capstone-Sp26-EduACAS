"use client";

import { useEffect, useState } from "react";
import { Button, Spinner } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useThemeContext } from "@/components/theme-provider";
import type { Material } from "@/types/material";

type MaterialPreviewDrawerProps = {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
};

function getFileCategory(filename: string): "image" | "pdf" | "video" | "code" | "text" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "html", "css", "json", "xml", "yaml", "yml", "sql", "sh", "bash", "md"].includes(ext))
    return "code";
  if (["txt", "log", "csv"].includes(ext)) return "text";
  return "other";
}

function MaterialPreviewDrawer({
  material,
  isOpen,
  onClose,
}: MaterialPreviewDrawerProps) {
  const { isDark } = useThemeContext();
  const { getFileUrl } = usePrivateS3();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !material) {
      setPreviewUrl(null);
      return;
    }

    const loadPreview = async () => {
      setLoading(true);
      try {
        const url = await getFileUrl(material.filename);
        setPreviewUrl(url);
      } catch {
        setPreviewUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, material, getFileUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (!previewUrl || !material) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = material.filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!material) return null;

  const category = getFileCategory(material.filename);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <Spinner size="xl" />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <DocumentIcon className="h-16 w-16 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            Unable to load preview
          </p>
        </div>
      );
    }

    switch (category) {
      case "image":
        return (
          <div className="flex justify-center bg-gray-100 p-4 dark:bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={material.filename}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          </div>
        );

      case "pdf":
        return (
          <iframe
            src={previewUrl}
            title={material.filename}
            className="h-[80vh] w-full rounded-lg"
          />
        );

      case "video":
        return (
          <video
            controls
            className="max-h-[80vh] w-full rounded-lg"
            src={previewUrl}
          >
            Your browser does not support the video tag.
          </video>
        );

      case "code":
      case "text":
        return <TextPreview url={previewUrl} />;

      default:
        return (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <DocumentIcon className="h-16 w-16 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              Preview not available for this file type
            </p>
            <Button
              color="info"
              size="sm"
              onClick={handleDownload}
              className="bg-[#1F4E79] hover:bg-[#2A6BA3] text-white"
            >
              <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              Download to View
            </Button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 right-0 top-0 z-50 flex w-[90vw] flex-col shadow-2xl lg:w-[900px] xl:w-[1100px] ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-full bg-[#1F4E79]/10 p-2 dark:bg-[#C9A24D]/10">
                  <EyeIcon className="h-5 w-5 text-[#1F4E79] dark:text-[#C9A24D]" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                    {material.filename}
                  </h2>
                  {material.description && (
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {material.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  color="gray"
                  size="sm"
                  pill
                  onClick={handleDownload}
                  title="Download"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </Button>
                <Button
                  color="gray"
                  size="sm"
                  pill
                  onClick={onClose}
                  title="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto">{renderPreview()}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent(null);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <DocumentIcon className="h-16 w-16 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load file content
        </p>
      </div>
    );
  }

  return (
    <pre
      className={`max-h-[80vh] overflow-auto p-4 text-sm font-mono leading-relaxed ${
        "bg-gray-900 text-gray-100"
      }`}
    >
      <code>{content}</code>
    </pre>
  );
}

export default MaterialPreviewDrawer;
