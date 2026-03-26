"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
  onAnalyze: (files: File[]) => void;
  isProcessing: boolean;
}

export default function UploadZone({
  onAnalyze,
  isProcessing,
}: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        (f) => f.type === "application/pdf",
      );
      setFiles((prev) => {
        const combined = [...prev, ...pdfFiles];
        return combined.slice(0, 20);
      });
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 20,
    disabled: isProcessing,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (files.length > 0) {
      onAnalyze(files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? "border-purple-400 bg-purple-500/10 scale-[1.02]" : "border-gray-600 hover:border-purple-500/50 hover:bg-white/5"}
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-lg text-gray-300 mb-1">
          {isDragActive
            ? "Drop your PDFs here..."
            : "Drag & drop PDF notes here"}
        </p>
        <p className="text-sm text-gray-500">
          or click to browse (up to 20 files)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </h3>
            {files.length >= 20 && (
              <span className="text-xs text-amber-400">Maximum reached</span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg
                    className="w-4 h-4 text-red-400 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 18h12a2 2 0 002-2V6l-4-4H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={isProcessing}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isProcessing || files.length === 0}
            className="w-full mt-4 py-3 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Analyze {files.length} PDF{files.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
