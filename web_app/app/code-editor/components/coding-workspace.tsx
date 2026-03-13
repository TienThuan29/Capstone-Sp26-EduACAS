'use client';

import React from 'react';
import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';
import {
  HeaderToolbar,
  EditorPanel,
  ProblemPanel,
  ConsolePanel,
  ActionFooter,
} from '.';
import { Button } from 'flowbite-react';

// Custom resize handle component
function ResizeHandle({
  direction = 'horizontal',
}: {
  direction?: 'horizontal' | 'vertical';
}) {
  const isHorizontal = direction === 'horizontal';

  return (
    <Separator
      className={clsx(
        'group relative flex items-center justify-center bg-gray-800 transition-colors hover:bg-blue-600/50 data-[resize-handle-active]:bg-blue-600',
        isHorizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'
      )}
    />
  );
}

export function CodingWorkspace() {
  const { isLeftPanelCollapsed, toggleLeftPanel } = useEditorContext();

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Group orientation="horizontal" id="coding-workspace-horizontal">
          {/* Problem Panel (Left) */}
          {!isLeftPanelCollapsed && (
            <>
              <Panel
                defaultSize={300}
                minSize={100}
                maxSize={600}
                id="problem-panel"
              >
                <div className="relative h-full">
                  {/* Collapse Button */}
                    <Button
                      onClick={toggleLeftPanel}
                      className="absolute right-2 top-1 z-10 rounded-md bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  {/* ---- Problem Panel ---- */}
                  <ProblemPanel />
                </div>
              </Panel>
              <ResizeHandle direction="horizontal" />
            </>
          )}

          {/* Workspace Panel (Right) - Editor + Console */}
          <Panel
            defaultSize={isLeftPanelCollapsed ? 100 : 65}
            minSize={30}
            id="workspace-panel"
          >
            <div className="flex h-full flex-col">
              {/* Expand Button when collapsed */}
              {isLeftPanelCollapsed && (
                <button
                  onClick={toggleLeftPanel}
                  className="absolute left-2 top-2 z-10 rounded-md bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                  title="Expand panel"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}

              {/* Header Toolbar */}
              <HeaderToolbar />

              {/* Editor + Console Split */}
              <div className="flex-1 overflow-hidden">
                <Group orientation="vertical" id="coding-workspace-vertical">
                  {/* Editor Panel */}
                  <Panel
                    defaultSize={60}
                    minSize={30}
                    id="editor-panel"
                  >
                    <EditorPanel />
                  </Panel>

                  <ResizeHandle direction="vertical" />

                  {/* Console Panel */}
                  <Panel
                    defaultSize={40}
                    minSize={20}
                    id="console-panel"
                  >
                    <ConsolePanel />
                  </Panel>
                </Group>
              </div>

              {/* Action Footer */}
              <ActionFooter />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
