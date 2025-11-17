import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useState } from "react";

interface ImportCSVProps {
  open: boolean;
  onClose: () => void;
  onImport?: (file: File) => void;
}

export function ImportCSV({ open, onClose, onImport }: ImportCSVProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("File selected:", file.name);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport?.(selectedFile);
      console.log("Importing file:", selectedFile.name);
      onClose();
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Supported Formats</Label>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">CSV, QIF, OFS, QFX, CAMT.053</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv,.qif,.ofs,.qfx,.xml"
                onChange={handleFileSelect}
                data-testid="input-file"
                className="cursor-pointer"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted/30 p-4 rounded-md">
            <p className="text-sm text-muted-foreground">
              Upload your transaction file and we'll automatically map the columns to the correct fields.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile}
            data-testid="button-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
