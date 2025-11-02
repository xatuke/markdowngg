/**
 * Local document history management
 * Stores document metadata in localStorage for zero-knowledge access
 */

export interface DocumentMetadata {
  id: string;
  encryptionKey: string;
  writeToken: string; // Token for write access
  title: string; // First line of content
  createdAt: number;
  lastModified: number;
}

const STORAGE_KEY = "document_history";

/**
 * Get all saved documents from history
 */
export function getDocumentHistory(): DocumentMetadata[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading document history:", error);
    return [];
  }
}

/**
 * Add or update a document in history
 */
export function saveToHistory(doc: DocumentMetadata): void {
  try {
    const history = getDocumentHistory();

    // Remove existing entry if present
    const filtered = history.filter((d) => d.id !== doc.id);

    // Add new entry at the beginning
    const updated = [doc, ...filtered];

    // Keep only the 50 most recent documents
    const limited = updated.slice(0, 50);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Error saving to document history:", error);
  }
}

/**
 * Remove a document from history
 */
export function removeFromHistory(id: string): void {
  try {
    const history = getDocumentHistory();
    const filtered = history.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from document history:", error);
  }
}

/**
 * Get a specific document from history
 */
export function getDocumentFromHistory(id: string): DocumentMetadata | null {
  const history = getDocumentHistory();
  return history.find((d) => d.id === id) || null;
}

/**
 * Extract title from markdown content (first heading or first line)
 */
export function extractTitle(content: string): string {
  if (!content) return "Untitled";

  const lines = content.split("\n");

  // Look for first heading
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/^#+\s*/, "").trim() || "Untitled";
    }
  }

  // Fallback to first non-empty line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      return trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : "");
    }
  }

  return "Untitled";
}
