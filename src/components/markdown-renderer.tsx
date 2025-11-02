"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import { AlertCircle } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  theme?: "light" | "dark";
}

interface RenderError {
  type: "katex" | "general";
  message: string;
  details?: string;
}

export function MarkdownRenderer({
  content,
  theme = "dark",
}: MarkdownRendererProps) {
  const [errors, setErrors] = useState<RenderError[]>([]);

  const isDark = theme === "dark";

  return (
    <div
      className={`prose ${isDark ? "prose-invert" : ""} prose-sm max-w-none p-6 overflow-auto h-full`}
      style={{
        fontSize: "14px",
        lineHeight: "1.6",
      }}
    >
      <style jsx global>{`
        .prose {
          color: ${isDark ? "#f2f2f2" : "#1a1a1a"};
        }

        .prose h1 {
          font-size: 1.75rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: ${isDark ? "#f2f2f2" : "#1a1a1a"};
        }

        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: ${isDark ? "#f2f2f2" : "#1a1a1a"};
        }

        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: ${isDark ? "#f2f2f2" : "#1a1a1a"};
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .prose a {
          color: ${isDark ? "#cccccc" : "#3366cc"};
          text-decoration: underline;
        }

        .prose a:hover {
          color: ${isDark ? "#ffffff" : "#0044aa"};
        }

        .prose code {
          background-color: ${isDark ? "#1a1a1a" : "#f5f5f5"};
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          color: ${isDark ? "#f2f2f2" : "#1a1a1a"};
          border: 1px solid ${isDark ? "#333333" : "#e0e0e0"};
        }

        .prose pre {
          background-color: ${isDark ? "#0d1117" : "#f6f8fa"};
          border: 1px solid ${isDark ? "#30363d" : "#d0d7de"};
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .prose pre code {
          background-color: transparent;
          padding: 0;
          border: none;
          color: ${isDark ? "#e6edf3" : "#24292f"};
          font-family:
            ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
            "Liberation Mono", monospace;
          font-size: 0.875em;
          line-height: 1.6;
        }

        .prose blockquote {
          border-left: 3px solid ${isDark ? "#333333" : "#cccccc"};
          padding-left: 1rem;
          color: ${isDark ? "#cccccc" : "#666666"};
          font-style: italic;
          margin: 1rem 0;
        }

        .prose ul,
        .prose ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .prose li {
          margin: 0.25rem 0;
        }

        .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .prose th,
        .prose td {
          border: 1px solid ${isDark ? "#333333" : "#cccccc"};
          padding: 0.5rem;
          text-align: left;
        }

        .prose th {
          background-color: ${isDark ? "#1a1a1a" : "#f5f5f5"};
          font-weight: 600;
        }

        .prose hr {
          border: none;
          border-top: 1px solid ${isDark ? "#333333" : "#cccccc"};
          margin: 1.5rem 0;
        }

        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1rem 0;
        }

        /* Syntax highlighting styles */
        .prose .hljs {
          display: block;
          overflow-x: auto;
          padding: 0;
          background: transparent;
        }

        .prose .hljs-comment,
        .prose .hljs-quote {
          color: ${isDark ? "#8b949e" : "#6a737d"};
          font-style: italic;
        }

        .prose .hljs-keyword,
        .prose .hljs-selector-tag,
        .prose .hljs-subst {
          color: ${isDark ? "#ff7b72" : "#d73a49"};
        }

        .prose .hljs-number,
        .prose .hljs-literal,
        .prose .hljs-variable,
        .prose .hljs-template-variable,
        .prose .hljs-tag .hljs-attr {
          color: ${isDark ? "#79c0ff" : "#005cc5"};
        }

        .prose .hljs-string,
        .prose .hljs-doctag {
          color: ${isDark ? "#a5d6ff" : "#032f62"};
        }

        .prose .hljs-title,
        .prose .hljs-section,
        .prose .hljs-selector-id {
          color: ${isDark ? "#d2a8ff" : "#6f42c1"};
          font-weight: bold;
        }

        .prose .hljs-type,
        .prose .hljs-class .hljs-title {
          color: ${isDark ? "#ffa657" : "#e36209"};
        }

        .prose .hljs-tag,
        .prose .hljs-name,
        .prose .hljs-attribute {
          color: ${isDark ? "#7ee787" : "#22863a"};
        }

        .prose .hljs-regexp,
        .prose .hljs-link {
          color: ${isDark ? "#a5d6ff" : "#032f62"};
        }

        .prose .hljs-symbol,
        .prose .hljs-bullet {
          color: ${isDark ? "#ffa657" : "#e36209"};
        }

        .prose .hljs-built_in,
        .prose .hljs-builtin-name {
          color: ${isDark ? "#ffa657" : "#e36209"};
        }

        .prose .hljs-meta {
          color: ${isDark ? "#8b949e" : "#6a737d"};
        }

        .prose .hljs-deletion {
          color: ${isDark ? "#ff7b72" : "#d73a49"};
          background: ${isDark ? "#490202" : "#ffeef0"};
        }

        .prose .hljs-addition {
          color: ${isDark ? "#7ee787" : "#22863a"};
          background: ${isDark ? "#04260f" : "#f0fff4"};
        }

        .prose .hljs-emphasis {
          font-style: italic;
        }

        .prose .hljs-strong {
          font-weight: bold;
        }
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>

      {/* Error log pane */}
      {errors.length > 0 && (
        <div className="error-log-pane">
          <div className="error-log-header">
            <AlertCircle className="w-4 h-4" />
            <span>Rendering Errors ({errors.length})</span>
          </div>
          <div className="error-log-content">
            {errors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-title">
                  {error.type === "katex" && "LaTeX Math"}
                  {error.type === "general" && "Markdown"}: {error.message}
                </div>
                {error.details && (
                  <div className="error-details">{error.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .error-log-pane {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: ${isDark ? "#1a1a1a" : "#fff5f5"};
          border-top: 1px solid ${isDark ? "#663333" : "#ffc9c9"};
          max-height: 200px;
          overflow-y: auto;
        }

        .error-log-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background-color: ${isDark ? "#2a1a1a" : "#ffebeb"};
          color: ${isDark ? "#ff6666" : "#cc0000"};
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 1px solid ${isDark ? "#663333" : "#ffc9c9"};
        }

        .error-log-content {
          padding: 0.5rem 1rem;
        }

        .error-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid ${isDark ? "#333333" : "#cccccc"};
        }

        .error-item:last-child {
          border-bottom: none;
        }

        .error-title {
          color: ${isDark ? "#ff8888" : "#cc0000"};
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .error-details {
          color: ${isDark ? "#cccccc" : "#333333"};
          font-size: 0.75rem;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
