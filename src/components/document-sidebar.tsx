"use client";

import { DocumentMetadata, removeFromHistory } from "@/lib/document-history";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentSidebarProps {
  documents: DocumentMetadata[];
  currentDocumentId: string | null;
  onSelectDocument: (doc: DocumentMetadata) => void;
  onDeleteDocument: (id: string) => void;
}

export function DocumentSidebar({
  documents,
  currentDocumentId,
  onSelectDocument,
  onDeleteDocument,
}: DocumentSidebarProps) {
  if (documents.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No saved documents yet. Click "Share" to save your first document.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold">Your Documents</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {documents.length} saved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group border-b border-border hover:bg-accent transition-colors ${
              currentDocumentId === doc.id ? "bg-accent" : ""
            }`}
          >
            <div
              onClick={() => onSelectDocument(doc)}
              className="w-full text-left p-3 pr-10 relative cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(doc.lastModified, {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
