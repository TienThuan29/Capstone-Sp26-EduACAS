'use client';
import { Button, Card } from 'flowbite-react';
import { useToast } from '@/hooks/useToast';

export default function TestComponentsPage() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.showSuccess('Item moved successfully.');
  };

  const handleError = () => {
    toast.showError('Item has been deleted.');
  };

  const handleWarning = () => {
    toast.showWarning('Improve password difficulty.');
  };

  const handleInfo = () => {
    toast.showInfo('Here is some information for you.');
  };

  const handleMultiple = () => {
    toast.showSuccess('First toast - Success!');
    setTimeout(() => toast.showError('Second toast - Error!'), 300);
    setTimeout(() => toast.showWarning('Third toast - Warning!'), 600);
    setTimeout(() => toast.showInfo('Fourth toast - Info!'), 900);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">

        <Card className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Toast
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button color="green"
              onClick={handleSuccess}
              className="w-full"
            >
              Show Success Toast
            </Button>
            <Button
              color="red"
              onClick={handleError}
              className="w-full"
            >
              Show Error Toast
            </Button>
            <Button
              color="yellow"
              onClick={handleWarning}
              className="w-full"
            >
              Show Warning Toast
            </Button>
            <Button
              color="blue"
              onClick={handleInfo}
              className="w-full"
            >
              Show Info Toast
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}

