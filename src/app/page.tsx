"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/editor";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DocumentSidebar } from "@/components/document-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/theme-context";
import {
  Share2,
  FileText,
  Save,
  Copy,
  FilePlus,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import {
  generateKey,
  exportKey,
  encrypt,
  importKey,
  decrypt,
} from "@/lib/crypto";
import {
  getDocumentHistory,
  saveToHistory,
  removeFromHistory,
  extractTitle,
  DocumentMetadata,
} from "@/lib/document-history";

const DEFAULT_CONTENT = `# Welcome to markdown.gg

A zero-knowledge markdown editor with **LaTeX** support.

## Features

- Side-by-side editing and preview
- End-to-end encryption
- LaTeX math support
- GitHub Flavored Markdown
- Light and dark themes

## LaTeX Example

Inline math: $E = mc^2$

Display math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Code Example

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Tables

| Feature | Supported |
|---------|-----------|
| Markdown | ✓ |
| LaTeX | ✓ |
| Encryption | ✓ |

Start editing to see your changes!
`;

export default function Home() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documentHistory, setDocumentHistory] = useState<DocumentMetadata[]>(
    [],
  );
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Load document history on mount
  useEffect(() => {
    setDocumentHistory(getDocumentHistory());
  }, []);

  // Load document info from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("currentDocumentId");
    const savedKey = localStorage.getItem("currentEncryptionKey");

    if (savedId && savedKey) {
      setDocumentId(savedId);
      setEncryptionKey(savedKey);
    }
  }, []);

  // Keyboard shortcut for save (Ctrl+S or Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (documentId && encryptionKey && !isSaving && !isLoading) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [documentId, encryptionKey, isSaving, isLoading, content]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.querySelector(".editor-preview-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
      setEditorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Get the shareable URL
  const getShareUrl = () => {
    if (!documentId || !encryptionKey) return null;
    return `${window.location.origin}/view/${documentId}#${encryptionKey}`;
  };

  // Copy share URL to clipboard
  async function copyShareUrl() {
    const url = getShareUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  }

  // Save updates to existing document
  async function handleSave() {
    if (!documentId || !encryptionKey) return;

    try {
      setIsSaving(true);

      // Import the key and encrypt content
      const key = await importKey(encryptionKey);
      const encryptedContent = await encrypt(content, key);

      // Update on server
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      // Update in history
      saveToHistory({
        id: documentId,
        encryptionKey: encryptionKey,
        title: extractTitle(content),
        createdAt: Date.now(),
        lastModified: Date.now(),
      });

      setDocumentHistory(getDocumentHistory());

      toast({
        title: "Saved",
        description: "Document updated successfully",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Create new share (first time or create new document)
  async function handleShare() {
    try {
      setIsSharing(true);

      // Generate encryption key
      const key = await generateKey();
      const keyString = await exportKey(key);

      // Encrypt content
      const encryptedContent = await encrypt(content, key);

      // Save to server
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      const { id } = await response.json();

      // Store in localStorage
      localStorage.setItem("currentDocumentId", id);
      localStorage.setItem("currentEncryptionKey", keyString);

      setDocumentId(id);
      setEncryptionKey(keyString);

      // Save to history
      const now = Date.now();
      saveToHistory({
        id,
        encryptionKey: keyString,
        title: extractTitle(content),
        createdAt: now,
        lastModified: now,
      });

      setDocumentHistory(getDocumentHistory());

      // Create shareable URL with key in hash
      const url = `${window.location.origin}/view/${id}#${keyString}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(url);

      toast({
        title: "Link copied to clipboard",
        description: "Share this link to let others view your document",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Failed to create shareable link",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  }

  // Start a new document
  function handleNew() {
    localStorage.removeItem("currentDocumentId");
    localStorage.removeItem("currentEncryptionKey");
    setDocumentId(null);
    setEncryptionKey(null);
    setContent(DEFAULT_CONTENT);

    toast({
      title: "New document",
      description: "Started a new document",
    });
  }

  // Load a document from history
  async function loadDocument(doc: DocumentMetadata) {
    try {
      setIsLoading(true);

      // Fetch encrypted document
      const response = await fetch(`/api/documents/${doc.id}`);
      if (!response.ok) {
        throw new Error("Document not found");
      }

      const { encryptedContent } = await response.json();

      // Decrypt content
      const key = await importKey(doc.encryptionKey);
      const decryptedContent = await decrypt(encryptedContent, key);

      // Update state
      setContent(decryptedContent);
      setDocumentId(doc.id);
      setEncryptionKey(doc.encryptionKey);

      // Store as current document
      localStorage.setItem("currentDocumentId", doc.id);
      localStorage.setItem("currentEncryptionKey", doc.encryptionKey);

      setSidebarOpen(false);

      toast({
        title: "Document loaded",
        description: doc.title,
      });
    } catch (error) {
      console.error("Error loading document:", error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Delete a document from history
  function deleteDocument(id: string) {
    removeFromHistory(id);
    setDocumentHistory(getDocumentHistory());

    // If it's the current document, clear it
    if (documentId === id) {
      handleNew();
    }

    toast({
      title: "Document removed",
      description: "Removed from your history",
    });
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>

          <FileText className="w-5 h-5" />
          <h1 className="text-base font-semibold">markdown.gg</h1>

          {documentId && (
            <Button
              onClick={copyShareUrl}
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1.5 ml-4"
              title="Copy share link"
            >
              <Copy className="w-3 h-3" />
              <span className="text-xs hidden sm:inline">Copy link</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleTheme}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {documentId ? (
            <>
              <Button
                onClick={handleNew}
                size="sm"
                variant="outline"
                className="gap-2"
                title="New document"
              >
                <FilePlus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                size="sm"
                className="gap-2"
                title={isSaving ? "Saving..." : "Save document"}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : "Save"}
                </span>
              </Button>
            </>
          ) : (
            <Button
              onClick={handleShare}
              disabled={isSharing || isLoading}
              size="sm"
              className="gap-2"
              title={isSharing ? "Creating link..." : "Share document"}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSharing ? "Creating link..." : "Share"}
              </span>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Tabs (visible on small screens) */}
      <div className="md:hidden flex border-b border-border">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "editor"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div className="w-64 border-r border-border bg-card overflow-hidden">
              <DocumentSidebar
                documents={documentHistory}
                currentDocumentId={documentId}
                onSelectDocument={loadDocument}
                onDeleteDocument={deleteDocument}
              />
            </div>
            <Separator orientation="vertical" />
          </>
        )}

        {/* Mobile View: Single Panel with Tabs */}
        <div className="flex-1 overflow-hidden md:hidden">
          {activeTab === "editor" ? (
            <Editor value={content} onChange={setContent} theme={theme} />
          ) : (
            <div className="h-full overflow-auto">
              <MarkdownRenderer content={content} theme={theme} />
            </div>
          )}
        </div>

        {/* Desktop View: Split Panel with Resizable Divider */}
        <div className="hidden md:flex flex-1 overflow-hidden editor-preview-container">
          {/* Editor */}
          <div style={{ width: `${editorWidth}%` }} className="overflow-hidden">
            <Editor value={content} onChange={setContent} theme={theme} />
          </div>

          {/* Resizable Divider */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>

          {/* Preview */}
          <div
            style={{ width: `${100 - editorWidth}%` }}
            className="overflow-auto"
          >
            <MarkdownRenderer content={content} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
