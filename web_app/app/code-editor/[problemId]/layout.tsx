import { Metadata } from 'next';
import { EditorProvider } from '../../../hooks/editor/EditorContext';

export const metadata: Metadata = {
  title: 'Coding Workspace | Edu-ACAS',
  description: 'Automated Console-based Programming Assessment System - Coding Workspace',
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
