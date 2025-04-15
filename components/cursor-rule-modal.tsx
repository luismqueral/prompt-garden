"use client"

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MdContentCopy, MdDownload, MdCheck } from 'react-icons/md';

interface CursorRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  promptTitle?: string;
}

export function CursorRuleModal({ isOpen, onClose, promptText, promptTitle }: CursorRuleModalProps) {
  const [copied, setCopied] = useState(false);

  // Function to copy prompt text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Function to download prompt as .mdc file
  const downloadAsFile = () => {
    try {
      // Create a new blob with the prompt text
      const blob = new Blob([promptText], { type: 'text/plain' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate a filename based on prompt title or default
      const filename = promptTitle 
        ? `${promptTitle.toLowerCase().replace(/\s+/g, '-')}.mdc` 
        : `cursor-rule-${new Date().getTime()}.mdc`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add as Cursor Rule</DialogTitle>
          <DialogDescription>
            Choose how you want to add this prompt as a Cursor rule
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={copyToClipboard}>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 text-blue-600">
                {copied ? <MdCheck size={18} /> : <MdContentCopy size={18} />}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Copy to Clipboard</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Copy the prompt text and paste it into Cursor&apos;s rules settings.
                </p>
                <ol className="mt-2 text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>In Cursor, click on the settings gear icon</li>
                  <li>Navigate to &quot;AI&quot; → &quot;Rules&quot;</li>
                  <li>Click &quot;Add Rule&quot; and paste the copied prompt</li>
                  <li>Configure the rule settings and save</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={downloadAsFile}>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2 text-green-600">
                <MdDownload size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Download as .mdc File</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Download the prompt as an .mdc file to use in Cursor.
                </p>
                <ol className="mt-2 text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Download the .mdc file to your computer</li>
                  <li>In Cursor, click on the settings gear icon</li>
                  <li>Navigate to &quot;AI&quot; → &quot;Rules&quot;</li>
                  <li>Click &quot;Import Rule&quot; and select the downloaded file</li>
                  <li>Adjust any settings if necessary and save</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 