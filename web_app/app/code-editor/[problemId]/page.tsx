import { CodeEditorClient } from '../components/code-editor-client';

interface PageProps {
  params: Promise<{
    problemId: string;
  }>;
  searchParams: Promise<{
    exam?: string;
    duration?: string;
  }>;
}

export default async function CodeEditorPage({ params, searchParams }: PageProps) {
  const { problemId } = await params;
  const { exam, duration } = await searchParams;

  const isExamMode = exam === 'true';
  const examDuration = duration ? parseInt(duration, 10) : 3600; // Default 1 hour

  return (
    <CodeEditorClient
      problemId={problemId}
      isExamMode={isExamMode}
      examDuration={examDuration}
    />
  );
}
