"use client";

import { useState } from "react";
import { User, Upload } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  editable?: boolean;
  onUpload?: (file: File) => void;
  className?: string;
  isUploading?: boolean;
}

const sizeClasses = {
  sm: "w-[32px] h-[32px] text-[14px]",
  md: "w-[48px] h-[48px] text-[18px]",
  lg: "w-[64px] h-[64px] text-[24px]",
  xl: "w-[96px] h-[96px] text-[36px]",
};

export default function Avatar({
  src,
  name,
  size = "md",
  color = "#1294f2",
  editable = false,
  onUpload,
  className = "",
  isUploading = false,
}: AvatarProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get initial from name
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-lg`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-['Poppins'] font-bold text-white border-2 border-white shadow-lg`}
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
      )}

      {/* Upload overlay */}
      {editable && isHovered && !isUploading && (
        <label
          htmlFor={`avatar-upload-${name}`}
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-black/50 flex items-center justify-center cursor-pointer transition-all`}
        >
          <Upload className="w-[20px] h-[20px] text-white" />
          <input
            id={`avatar-upload-${name}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* Loading overlay */}
      {isUploading && (
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-black/50 flex items-center justify-center transition-all`}>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
