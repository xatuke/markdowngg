"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { FileText, AlertCircle } from "lucide-react";
import { importKey, decrypt } from "@/lib/crypto";

export default function ViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDocument() {
      try {
        // Get encryption key from URL hash
        const hash = window.location.hash.substring(1);
        if (!hash) {
          throw new Error("No encryption key found in URL");
        }

        // Fetch encrypted document
        const response = await fetch(`/api/documents/${id}`);
        if (!response.ok) {
          throw new Error("Document not found");
        }

        const { encryptedContent } = await response.json();

        // Decrypt content
        const key = await importKey(hash);
        const decryptedContent = await decrypt(encryptedContent, key);

        setContent(decryptedContent);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadDocument();
    }
  }, [id]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h1 className="text-base font-semibold">markdown.gg</h1>
          <span className="text-xs text-muted-foreground">
            (read-only)
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground text-sm">
              Loading document...
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {content && <MarkdownRenderer content={content} />}
      </div>
    </div>
  );
}
