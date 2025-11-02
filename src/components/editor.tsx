"use client";

import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: "light" | "dark";
}

export function Editor({ value, onChange, theme = "dark" }: EditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const valueRef = useRef(value);
  const isUserChangeRef = useRef(false);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure dark theme
    monaco.editor.defineTheme("markdown-dark", {
      base: "vs-dark",
      inherit: true,

      rules: [],
      colors: {
        "editor.background": "#141414",
        "editor.foreground": "#f2f2f2",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editorCursor.foreground": "#f2f2f2",
        "editorLineNumber.foreground": "#666666",
        "editorLineNumber.activeForeground": "#999999",
      },
    });

    // Configure light theme
    monaco.editor.defineTheme("markdown-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1a1a1a",
        "editor.lineHighlightBackground": "#f5f5f5",
        "editorCursor.foreground": "#1a1a1a",
        "editorLineNumber.foreground": "#999999",
        "editorLineNumber.activeForeground": "#666666",
      },
    });

    monaco.editor.setTheme(
      theme === "dark" ? "markdown-dark" : "markdown-light",
    );
  }

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(
        theme === "dark" ? "markdown-dark" : "markdown-light",
      );
    }
  }, [theme]);

  function handleEditorChange(newValue: string | undefined) {
    const val = newValue || "";
    isUserChangeRef.current = true;
    valueRef.current = val;
    onChange(val);
  }

  // Update editor value only when it changes externally (not from user typing)
  useEffect(() => {
    if (
      editorRef.current &&
      !isUserChangeRef.current &&
      value !== valueRef.current
    ) {
      const editor = editorRef.current;
      const model = editor.getModel();

      if (model) {
        // Save cursor position
        const position = editor.getPosition();
        const scrollTop = editor.getScrollTop();

        // Update value
        model.setValue(value);
        valueRef.current = value;

        // Restore cursor position if it's still valid
        if (position) {
          const lineCount = model.getLineCount();
          if (position.lineNumber <= lineCount) {
            editor.setPosition(position);
            editor.setScrollTop(scrollTop);
          }
        }
      }
    }
    isUserChangeRef.current = false;
  }, [value]);

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="markdown"
      defaultValue={value}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 16, bottom: 16 },
        lineHeight: 24,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
    />
  );
}
