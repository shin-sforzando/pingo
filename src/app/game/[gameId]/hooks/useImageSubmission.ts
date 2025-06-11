import type { ImageSubmissionResult } from "@/types/schema";
import { useCallback, useState } from "react";

type UploadCompleteHandler = (
  success: boolean,
  result?: ImageSubmissionResult,
  error?: string,
) => void;

interface UseImageSubmissionProps {
  refreshParticipants: () => Promise<void>;
  refreshSubmissions: () => Promise<void>;
  setIsUploading: (isUploading: boolean) => void;
}

/**
 * Hook for handling image submission workflow
 * Manages upload state and coordinates data refresh after successful submissions
 */
export function useImageSubmission({
  refreshParticipants,
  refreshSubmissions,
  setIsUploading,
}: UseImageSubmissionProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  /**
   * Handles completion of image upload process
   * Triggers data refresh on success to update UI with new game state
   */
  const handleUploadComplete: UploadCompleteHandler = useCallback(
    async (success, result, error) => {
      setIsUploading(false);

      if (success && result) {
        setSubmissionError(null);
        // Refresh data to show updated participant stats and submission history
        await Promise.all([refreshParticipants(), refreshSubmissions()]);
      } else {
        setSubmissionError(error || "Upload failed");
      }
    },
    [refreshParticipants, refreshSubmissions, setIsUploading],
  );

  /**
   * Handles start of image upload process
   * Clears previous errors and sets loading state
   */
  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setSubmissionError(null);
  }, [setIsUploading]);

  return {
    submissionError,
    handleUploadComplete,
    handleUploadStart,
  };
}
