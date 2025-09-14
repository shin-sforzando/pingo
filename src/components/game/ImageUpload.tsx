"use client";

import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  createImagePreviewUrl,
  isValidFileSize,
  isValidImageFile,
  processImage,
  revokeImagePreviewUrl,
} from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { submitImage } from "@/services/image-upload";
import type {
  ImageSubmissionResult,
  ImageUploadProps,
  ProcessedImage,
} from "@/types/schema";

interface ImagePreview {
  file: File;
  previewUrl: string;
  processedImage?: ProcessedImage;
  error?: string;
}

/**
 * ImageUpload component for handling image selection, processing, and upload
 * Supports drag & drop, file validation, and client-side image processing
 */
export function ImageUpload({
  gameId,
  onImageProcessed,
  onUploadStart,
  onUploadComplete,
  isUploading = false,
  className,
  disabled = false,
}: ImageUploadProps) {
  const t = useTranslations("imageUpload");
  const { user } = useAuth();
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview URL when component unmounts or preview changes
  const cleanupPreview = useCallback(() => {
    if (preview?.previewUrl) {
      revokeImagePreviewUrl(preview.previewUrl);
    }
  }, [preview?.previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;

      // Clean up previous preview
      cleanupPreview();

      // Validate file
      if (!isValidImageFile(file)) {
        setPreview({
          file,
          previewUrl: "",
          error: t("errors.unsupportedFileType"),
        });
        return;
      }

      if (!isValidFileSize(file)) {
        setPreview({
          file,
          previewUrl: "",
          error: t("errors.fileTooLarge"),
        });
        return;
      }

      // For HEIC files, we need to process first to get a proper preview
      const isHeicFile =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      if (isHeicFile) {
        // For HEIC files, process first then create preview from processed image
        setPreview({
          file,
          previewUrl: "",
        });

        setIsProcessing(true);
        try {
          const processedImage = await processImage(file);

          // Create preview URL from processed JPEG blob
          const processedPreviewUrl = URL.createObjectURL(processedImage.blob);

          setPreview({
            file,
            previewUrl: processedPreviewUrl,
            processedImage,
          });

          onImageProcessed?.(processedImage);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("errors.processingFailed");
          setPreview({
            file,
            previewUrl: "",
            error: errorMessage,
          });
        } finally {
          setIsProcessing(false);
        }
      } else {
        // For other formats, create preview first then process
        const previewUrl = createImagePreviewUrl(file);
        setPreview({
          file,
          previewUrl,
        });

        // Process image
        setIsProcessing(true);
        try {
          const processedImage = await processImage(file);
          setPreview((prev) =>
            prev
              ? {
                  ...prev,
                  processedImage,
                }
              : null,
          );
          onImageProcessed?.(processedImage);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : t("errors.processingFailed");
          setPreview((prev) =>
            prev
              ? {
                  ...prev,
                  error: errorMessage,
                }
              : null,
          );
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [disabled, isUploading, cleanupPreview, onImageProcessed, t],
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragOver(true);
      }
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (0 < files.length) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, isUploading, handleFileSelect],
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && 0 < files.length) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  // Handle remove image
  const handleRemove = useCallback(() => {
    cleanupPreview();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [cleanupPreview]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ handleUpload called", {
      hasPreview: !!preview,
      hasProcessedImage: !!preview?.processedImage,
      isUploading,
      hasUser: !!user,
    });

    if (!preview?.processedImage || isUploading) return;

    if (!user) {
      console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ Upload failed - no user");
      onUploadComplete?.(false, undefined, "Authentication required");
      return;
    }

    console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ Starting upload");
    onUploadStart?.();

    try {
      // Get authentication token from Firebase Auth
      const { auth } = await import("@/lib/firebase/client");
      const authToken = await auth.currentUser?.getIdToken();
      if (!authToken) {
        throw new Error("Failed to get authentication token");
      }

      // Prepare submission data
      const submissionData = {
        gameId,
        fileName: preview.processedImage.originalName,
        contentType: "image/jpeg", // Always JPEG after processing
        processedSize: preview.processedImage.processedSize,
        originalDimensions: preview.processedImage.originalDimensions,
        processedDimensions: preview.processedImage.processedDimensions,
      };

      console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ Submitting image", {
        submissionData,
      });

      // Submit image
      const result: ImageSubmissionResult = await submitImage(
        preview.processedImage,
        submissionData,
        authToken,
      );

      console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ Upload successful", { result });

      // Clear preview after successful upload
      handleRemove();

      onUploadComplete?.(true, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      console.log("ℹ️ XXX: ~ ImageUpload.tsx ~ Upload failed", {
        error,
        errorMessage,
      });
      onUploadComplete?.(false, undefined, errorMessage);
    }
  }, [
    preview,
    isUploading,
    user,
    gameId,
    onUploadStart,
    onUploadComplete,
    handleRemove,
  ]);

  const isInteractive = !disabled && !isUploading;

  return (
    <div
      className={cn("space-y-4", className)}
      data-testid="image-upload-container"
    >
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          isDragOver && "border-primary bg-primary/5",
          !isInteractive && "cursor-not-allowed opacity-50",
          isInteractive && "cursor-pointer hover:border-primary/50",
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">{t("processing")}</p>
            </>
          ) : preview ? (
            <div className="w-full space-y-4">
              {/* Image preview */}
              {preview.previewUrl && (
                <div className="relative mx-auto max-w-xs">
                  <Image
                    src={preview.previewUrl}
                    alt="Preview"
                    width={320}
                    height={240}
                    className="h-auto w-full rounded-lg shadow-sm"
                    unoptimized={true}
                    onError={(error) => {
                      console.error("Image preview error:", error);
                      error.currentTarget.style.display = "none";
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="-top-2 -right-2 absolute h-6 w-6 rounded-full p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* File info */}
              <div className="text-muted-foreground text-sm">
                <p className="font-medium">{preview.file.name}</p>
                <p>
                  {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                  {preview.processedImage && (
                    <>
                      {" → "}
                      {(
                        preview.processedImage.processedSize /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </>
                  )}
                </p>
                {preview.processedImage && (
                  <p>
                    {preview.processedImage.originalDimensions.width}×
                    {preview.processedImage.originalDimensions.height}
                    {" → "}
                    {preview.processedImage.processedDimensions.width}×
                    {preview.processedImage.processedDimensions.height}
                  </p>
                )}
              </div>

              {/* Error message */}
              {preview.error && (
                <p className="text-destructive text-sm">{preview.error}</p>
              )}

              {/* Upload button */}
              {preview.processedImage && !preview.error && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t("uploadButton")}
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 font-medium text-lg">{t("dropZone.title")}</p>
              <p className="text-muted-foreground text-sm">
                {t("dropZone.description")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
