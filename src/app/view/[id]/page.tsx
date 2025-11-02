"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { FileText, AlertCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importKey, decrypt } from "@/lib/crypto";
import { saveToHistory, extractTitle } from "@/lib/document-history";

export default function ViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [writeToken, setWriteToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        // Parse URL hash for encryption key and optional write token
        const hash = window.location.hash.substring(1);
        if (!hash) {
          throw new Error("No encryption key found in URL");
        }

        // Parse hash parameters
        const hashParams = new URLSearchParams(hash);
        const keyString = hashParams.get("write")
          ? hash.split("&")[0] // If write token exists, key is before &
          : hash; // Otherwise, entire hash is the key
        const tokenString = hashParams.get("write");

        setEncryptionKey(keyString);
        setWriteToken(tokenString);

        // Fetch encrypted document
        const response = await fetch(`/api/documents/${id}`);
        if (!response.ok) {
          throw new Error("Document not found");
        }

        const { encryptedContent } = await response.json();

        // Decrypt content
        const key = await importKey(keyString);
        const decryptedContent = await decrypt(encryptedContent, key);

        setContent(decryptedContent);

        // Save to history
        const now = Date.now();
        saveToHistory({
          id,
          encryptionKey: keyString,
          writeToken: tokenString || "",
          title: extractTitle(decryptedContent),
          createdAt: now,
          lastModified: now,
        });
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

  // Open document in editor
  function openInEditor() {
    if (!encryptionKey) return;

    // Navigate to editor with document in URL
    const hash = writeToken
      ? `${id}#${encryptionKey}&write=${writeToken}`
      : `${id}#${encryptionKey}`;

    window.location.href = `/#${hash}`;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h1 className="text-base font-semibold">markdown.gg</h1>
          <span className="text-xs text-muted-foreground">
            {writeToken ? "(view mode)" : "(read-only)"}
          </span>
        </div>

        {writeToken && !isLoading && !error && (
          <Button
            onClick={openInEditor}
            size="sm"
            className="gap-2"
            title="Open in editor"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
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
