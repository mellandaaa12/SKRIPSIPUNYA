"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Code, Eye } from "lucide-react";

interface CodeEditorProps {
  initialCode?: string;
  readOnly?: boolean;
  onCodeChange?: (code: string) => void;
  height?: string;
}

export default function CodeEditor({
  initialCode = "",
  readOnly = false,
  onCodeChange,
  height = "500px",
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const runCode = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  };

  const resetCode = () => {
    setCode(initialCode);
    if (onCodeChange) {
      onCodeChange(initialCode);
    }
    runCode();
  };

  useEffect(() => {
    if (showPreview && iframeRef.current) {
      runCode();
    }
  }, [code, showPreview]);

  return (
    <div className="w-full bg-white rounded-[2rem] border border-[#E2E8F0] overflow-hidden" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#56B6C6]" />
          <span className="font-semibold text-sm text-[#0077B6]">Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[1rem] text-sm font-medium text-[#0077B6] hover:bg-[#E2E8F0] transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            onClick={resetCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[1rem] text-sm font-medium text-[#0077B6] hover:bg-[#E2E8F0] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={runCode}
            className="flex items-center gap-2 px-4 py-1.5 rounded-[1rem] bg-[#56B6C6] text-white text-sm font-medium hover:bg-[#0EA5E9] transition-colors"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-60px)]">
        {/* Editor */}
        <div className={`flex-1 flex flex-col ${showPreview ? "w-1/2" : "w-full"}`}>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            readOnly={readOnly}
            placeholder="<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    /* CSS di sini */
  </style>
</head>
<body>
  <!-- HTML di sini -->
  <script>
    // JavaScript di sini
  </script>
</body>
</html>"
            className="flex-1 p-4 font-mono text-sm text-[#0077B6] bg-[#F8FAFC] resize-none focus:outline-none"
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-[#E2E8F0]">
            <iframe
              ref={iframeRef}
              title="Preview"
              className="w-full h-full bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
