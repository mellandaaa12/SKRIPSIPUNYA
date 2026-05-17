"use client";

import { useState } from "react";
import { Upload, File, X, Loader } from "lucide-react";
import { uploadFile } from "../utils/api";

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  label?: string;
  accessToken?: string; // Add accessToken prop
}

export default function FileUpload({
  onUploadComplete,
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  maxSize = 10,
  multiple = false,
  label = "Upload File",
  accessToken, // Destructure accessToken
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Get token from localStorage if not provided
    const token = accessToken || (() => {
      try {
        const session = JSON.parse(localStorage.getItem("supabase.auth.session") || "{}");
        return session?.access_token;
      } catch {
        return null;
      }
    })();

    if (!token) {
      setError("No access token found. Please login again.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          setError(`File ${file.name} terlalu besar. Maximum ${maxSize}MB`);
          continue;
        }

        const result = await uploadFile(file, token);
        onUploadComplete(result.url, result.fileName);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[12px] p-[24px] transition-all ${
          dragActive
            ? "border-[#1294f2] bg-[#eff6ff]"
            : "border-[#e2e8f0] bg-[#f8fafc]"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          id="file-upload"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center gap-[12px] cursor-pointer"
        >
          {uploading ? (
            <Loader className="w-[40px] h-[40px] text-[#1294f2] animate-spin" />
          ) : (
            <Upload className="w-[40px] h-[40px] text-[#94a3b8]" />
          )}

          <div className="text-center">
            <p className="font-['Poppins'] font-medium text-[14px] text-[#1e293b] mb-[4px]">
              {uploading ? "Uploading..." : label}
            </p>
            <p className="font-['Poppins'] text-[12px] text-[#64748b]">
              Drag & drop atau klik untuk pilih file (Max {maxSize}MB)
            </p>
          </div>
        </label>
      </div>

      {error && (
        <p className="font-['Poppins'] text-[12px] text-[#ef4444] mt-[8px]">
          {error}
        </p>
      )}
    </div>
  );
}