"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Button,
  TextInput,
  Pagination,
  Spinner,
  Avatar,
  Tooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  UserCircleIcon,
  ClockIcon,
  XMarkIcon,
  LockOpenIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/utils/datetime-utils";
import { useToast } from "@/hooks/useToast";
import { useThemeContext } from "@/components/theme-provider";
import { useAdminDiscussionIssue } from "@/hooks/discussion/useAdminDiscussionIssue";
import type { DiscussionIssueListItem, PagedDiscussionIssues, DiscussionIssue, Comment as DiscussionComment } from "@/types/discussion";
import Sidebar from "@/components/sidebar";

const PAGE_SIZE = 10;

export default function AdminDiscussionsPage() {
  const { isDark } = useThemeContext();
  const { showSuccess, showError } = useToast();
  const { getAdminDiscussions, getDiscussionDetail, toggleDiscussionStatus, softDeleteIssue, loading } = useAdminDiscussionIssue();

  const [pagedData, setPagedData] = useState<PagedDiscussionIssues | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Detail Modal States
  const [selectedIssue, setSelectedIssue] = useState<DiscussionIssue | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    try {
      const data = await getAdminDiscussions(searchTerm, currentPage, PAGE_SIZE);
      if (data) setPagedData(data);
    } catch (err) {
      // Error handled in hook
    }
  }, [getAdminDiscussions, searchTerm, currentPage]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDiscussions();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await getDiscussionDetail(id);
      if (detail) setSelectedIssue(detail);
    } catch (err) {
      showError("Could not load discussion details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await toggleDiscussionStatus(id, currentStatus);
      showSuccess(`Status updated to ${currentStatus === "OPEN" ? "CLOSED" : "OPEN"}`);
      fetchDiscussions();
    } catch (err) {
      showError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this discussion?")) return;
    try {
      await softDeleteIssue(id);
      showSuccess("Discussion deleted successfully");
      fetchDiscussions();
    } catch (err) {
      showError("Failed to delete discussion");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "success";
      case "CLOSED":
        return "gray";
      default:
        return "info";
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Discussion Management
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Monitor and moderate all discussion issues across classrooms
          </p>
        </div>
        <Button color="gray" onClick={() => fetchDiscussions()} disabled={loading}>
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className={isDark ? "bg-gray-800 border-gray-700" : "bg-white"}>
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <TextInput
                id="search"
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>
            <Button type="submit" color="info" disabled={loading}>
              Search
            </Button>
          </form>

          {loading && !pagedData ? (
            <div className="flex justify-center p-12">
              <Spinner size="xl" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table hoverable className={isDark ? "bg-gray-800" : ""}>
                <TableHead>
                  <TableRow>
                    <TableHeadCell className={isDark ? "bg-gray-700 text-gray-200" : ""}>Discussion</TableHeadCell>
                    <TableHeadCell className={`${isDark ? "bg-gray-700 text-gray-200" : ""} text-center`}>Author</TableHeadCell>
                    <TableHeadCell className={`${isDark ? "bg-gray-700 text-gray-200" : ""} text-center`}>Created Date</TableHeadCell>
                    <TableHeadCell className={`${isDark ? "bg-gray-700 text-gray-200" : ""} text-center`}>Stats</TableHeadCell>
                    <TableHeadCell className={`${isDark ? "bg-gray-700 text-gray-200" : ""} text-center`}>Status</TableHeadCell>
                    <TableHeadCell className={`${isDark ? "bg-gray-700 text-gray-200" : ""} text-center`}>Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedData && pagedData.items.length > 0 ? (
                    pagedData.items.map((item) => (
                      <TableRow key={item.id} className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                        <TableCell className="max-w-xs">
                          <div className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {item.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              img={item.authorDisplay?.avatarUrl}
                              rounded
                              size="sm"
                              placeholderInitials={item.authorDisplay?.fullName?.charAt(0)}
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                {item.authorDisplay?.fullName || "Unknown"}
                              </span>
                              <span className="text-xs text-gray-500">{item.authorDisplay?.email || item.authorId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {formatDate(item.createdDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-3 text-gray-500">
                            <Tooltip content="Views">
                              <div className="flex items-center gap-1">
                                <EyeIcon className="h-4 w-4" />
                                <span className="text-xs">{item.viewCount}</span>
                              </div>
                            </Tooltip>
                            <Tooltip content="Comments">
                              <div className="flex items-center gap-1">
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                <span className="text-xs">{item.commentCount}</span>
                              </div>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge color={getStatusColor(item.status)}>{item.status}</Badge>
                            {item.isDeleted && <Badge color="failure" size="xs">Deleted</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Tooltip content="View Detail">
                              <Button size="xs" color="info" onClick={() => handleViewDetail(item.id)}>
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content={item.status === "OPEN" ? "Close Discussion" : "Open Discussion"}>
                              <Button 
                                size="xs" 
                                color={item.status === "OPEN" ? "warning" : "success"}
                                onClick={() => handleToggleStatus(item.id, item.status)}
                                disabled={item.isDeleted}
                              >
                                {item.status === "OPEN" ? (
                                  <LockOpenIcon className="h-4 w-4" />
                                ) : (
                                  <LockClosedIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </Tooltip>

                            <Tooltip content="Soft Delete">
                              <Button 
                                size="xs" 
                                color="failure" 
                                onClick={() => handleDelete(item.id)} 
                                disabled={item.isDeleted}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <InformationCircleIcon className="h-16 w-16 text-gray-400" />
                          <div className="space-y-1">
                            <p className={`text-xl font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                              No discussion issues found
                            </p>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? `No results for "${searchTerm}"` : "The system has no discussion issues yet."}
                            </p>
                          </div>
                          {searchTerm && (
                            <Button color="gray" size="sm" onClick={() => setSearchTerm("")}>
                              Clear Search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {pagedData && pagedData.totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagedData.totalPages}
                onPageChange={handlePageChange}
                showIcons
              />
            </div>
          )}
        </div>
      </Card>
      </main>

      {/* Discussion Detail Modal */}
      <Modal 
        show={showDetailModal} 
        onClose={() => { setShowDetailModal(false); setSelectedIssue(null); }} 
        size="4xl"
        dismissible
      >
        <ModalHeader className={isDark ? "bg-gray-800 text-white border-gray-700" : ""}>
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-info" />
            <span>Discussion Details</span>
          </div>
        </ModalHeader>
        <ModalBody className={isDark ? "bg-gray-800 text-gray-300" : "bg-gray-50"}>
          {loadingDetail ? (
            <div className="flex justify-center p-12">
              <Spinner size="xl" />
            </div>
          ) : selectedIssue ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Issue Header */}
              <div className={`p-6 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedIssue.title}</h2>
                  <Badge color={getStatusColor(selectedIssue.status)}>{selectedIssue.status}</Badge>
                </div>
                
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 border-b border-gray-500/20 pb-4">
                  <div className="flex items-center gap-1.5">
                    <UserCircleIcon className="h-4 w-4" />
                    <span>By: <span className="font-semibold">{selectedIssue.authorDisplay?.fullName || "Unknown"}</span> ({selectedIssue.authorDisplay?.email || selectedIssue.authorId})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatDate(selectedIssue.createdDate)}</span>
                  </div>
                </div>

                <div className={`prose max-w-none ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <p className="whitespace-pre-wrap">{selectedIssue.content}</p>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Comments ({countAllComments(selectedIssue.comments)})
                </h3>
                
                {selectedIssue.comments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedIssue.comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} isDark={isDark} />
                    ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-lg border border-dashed ${isDark ? "border-gray-600 text-gray-500" : "border-gray-300 text-gray-400"}`}>
                    No comments found for this discussion.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 text-gray-500">
              Select a discussion to view details.
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}

// Recursive Comment Component
const CommentItem = ({ comment, isDark }: { comment: DiscussionComment, isDark: boolean }) => {
  return (
    <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-750 border-gray-600" : "bg-white border-gray-200"} ${comment.isDeleted ? "opacity-50 grayscale" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          img={comment.authorDisplay?.avatarUrl}
          rounded
          size="xs"
          placeholderInitials={comment.authorDisplay?.fullName?.charAt(0)}
        />
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {comment.authorDisplay?.fullName || "Author"} {comment.isDeleted && <Badge color="failure" size="xs" className="inline ml-2">Deleted</Badge>}
          </span>
          <span className="text-[10px] text-gray-500">{formatDate(comment.createdDate)}</span>
        </div>
      </div>
      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} whitespace-pre-wrap`}>
        {comment.content}
      </p>
      
      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-6 space-y-4 border-l-2 border-gray-500/20 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to count comments recursively
const countAllComments = (comments: DiscussionComment[]): number => {
  if (!comments || comments.length === 0) return 0;
  let count = comments.length;
  comments.forEach(c => {
    count += countAllComments(c.replies);
  });
  return count;
};
