import { Metadata } from 'next';
import { EditorProvider } from '@/contexts/EditorContext';

export const metadata: Metadata = {
  title: 'Coding Workspace | Edu-ACAS',
  description: '',
};

export default function CodeEditorLayout({
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
