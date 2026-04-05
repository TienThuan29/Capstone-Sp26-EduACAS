import { Metadata } from 'next';
import { EditorProvider } from '@/contexts/EditorContext';

export const metadata: Metadata = {
  title: 'Submission Review | Edu-ACAS',
  description: 'Review and manually grade a student submission',
};

export default function LecturerSubmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EditorProvider>
      <div className="h-screen w-screen overflow-hidden bg-gray-950">
        {children}
      </div>
    </EditorProvider>
  );
}
