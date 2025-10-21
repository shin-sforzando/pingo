"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/game/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImageSubmissionResult, ProcessedImage } from "@/types/schema";

/**
 * Debug page for testing ImageUpload component functionality
 */
export default function ImageUploadDebugPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] =
    useState<ImageSubmissionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);
    console.log("ℹ️ XXX: ~ page.tsx ~ Upload started");
  };

  const handleUploadComplete = (
    success: boolean,
    result?: ImageSubmissionResult,
    error?: string,
  ) => {
    setIsUploading(false);
    console.log("ℹ️ XXX: ~ page.tsx ~ Upload completed:", {
      success,
      result,
      error,
    });

    if (success && result) {
      setUploadResult(result);
      setUploadError(null);
    } else {
      setUploadError(error || "Upload failed");
      setUploadResult(null);
    }
  };

  const handleImageProcessed = (processedImage: ProcessedImage) => {
    console.log("ℹ️ XXX: ~ page.tsx ~ Image processed:", processedImage);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="space-y-6">
        {/* Page Header */}
        <Card>
          <CardHeader>
            <CardTitle>Image Upload Debug Page</CardTitle>
            <p className="text-muted-foreground">
              This page is for testing the ImageUpload component functionality.
            </p>
          </CardHeader>
        </Card>

        {/* Image Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
            <p className="text-muted-foreground">
              Upload an image to test the complete flow: validation, processing,
              upload, and AI content check.
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              gameId="DEBUG1"
              isUploading={isUploading}
              disabled={false}
              onUploadStart={handleUploadStart}
              onUploadComplete={
                handleUploadComplete as (...args: unknown[]) => unknown
              }
              onImageProcessed={
                handleImageProcessed as (...args: unknown[]) => unknown
              }
            />

            {/* Upload Result */}
            {uploadResult && (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="mb-2 font-medium text-green-800">
                  Upload Successful!
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Submission ID:</strong> {uploadResult.submissionId}
                  </p>
                  <p>
                    <strong>Image URL:</strong>{" "}
                    <a
                      href={uploadResult.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {uploadResult.imageUrl}
                    </a>
                  </p>
                  <p>
                    <strong>Content Appropriate:</strong>{" "}
                    {uploadResult.appropriate ? "✅ Yes" : "❌ No"}
                  </p>
                  {uploadResult.reason && (
                    <p>
                      <strong>AI Analysis:</strong> {uploadResult.reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 font-medium text-red-800">Upload Failed</h3>
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">1. Basic Upload Test</h4>
              <p className="text-muted-foreground text-sm">
                Upload a normal image (JPEG, PNG, etc.) to test the basic upload
                flow.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">2. File Validation Test</h4>
              <p className="text-muted-foreground text-sm">
                Try uploading an invalid file (e.g., text file, oversized image)
                to test validation.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">3. Content Moderation Test</h4>
              <p className="text-muted-foreground text-sm">
                Upload different types of images to test AI content analysis.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">4. Drag & Drop Test</h4>
              <p className="text-muted-foreground text-sm">
                Test drag and drop functionality by dragging an image file onto
                the upload area.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
