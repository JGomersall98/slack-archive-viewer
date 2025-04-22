"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { X, RotateCw, Download } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt,
  onClose,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number.parseFloat(e.target.value));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex justify-center items-center overflow-hidden bg-transparent rounded-t-lg">
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        <div className="w-full bg-black/70 p-4 rounded-b-lg">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-white text-sm">50%</span>
            <span className="text-white font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <span className="text-white text-sm">300%</span>
          </div>

          <div className="w-full flex items-center gap-2 mb-3">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={handleZoomChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              aria-label="Zoom level"
            />
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleRotate}
              className="p-2 text-white hover:bg-black/30 rounded-full flex items-center gap-1"
              aria-label="Rotate image"
            >
              <RotateCw className="h-4 w-4" />
              <span className="text-xs">Rotate</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-black/30 rounded-full flex items-center gap-1"
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
