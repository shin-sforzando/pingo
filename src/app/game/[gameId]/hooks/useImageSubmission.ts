import { useCallback, useEffect, useRef, useState } from "react";
import type { ConfettiRef } from "@/components/magicui/confetti";
import type { ImageSubmissionResult } from "@/types/schema";

type UploadCompleteHandler = (
  success: boolean,
  result?: ImageSubmissionResult,
  error?: string,
) => void;

interface UseImageSubmissionProps {
  refreshParticipants: () => Promise<void>;
  refreshSubmissions: () => Promise<void>;
  setIsUploading: (isUploading: boolean) => void;
  confettiRef?: React.RefObject<ConfettiRef>;
}

/**
 * Hook for handling image submission workflow
 * Manages upload state and coordinates data refresh after successful submissions
 */
export function useImageSubmission({
  refreshParticipants,
  refreshSubmissions,
  setIsUploading,
  confettiRef,
}: UseImageSubmissionProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const fireworksIntervalRef = useRef<number | null>(null);

  /**
   * Triggers spectacular fireworks confetti for game completion
   */
  const triggerFireworksConfetti = useCallback(() => {
    console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ Starting fireworks confetti");

    // Clear any existing fireworks interval to prevent multiple concurrent animations
    if (fireworksIntervalRef.current) {
      clearInterval(fireworksIntervalRef.current);
      fireworksIntervalRef.current = null;
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      colors: ["#08d9d6", "#ff2e63", "#eaeaea", "#252a34"],
    };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    let intervalCount = 0;
    fireworksIntervalRef.current = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      intervalCount++;

      if (timeLeft <= 0) {
        console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ Fireworks completed", {
          totalIntervals: intervalCount,
        });
        if (fireworksIntervalRef.current) {
          clearInterval(fireworksIntervalRef.current);
          fireworksIntervalRef.current = null;
        }
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side firework
      confettiRef?.current?.fire({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Right side firework
      confettiRef?.current?.fire({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, [confettiRef]);

  /**
   * Handles completion of image upload process
   * Triggers data refresh on success to update UI with new game state
   */
  const handleUploadComplete: UploadCompleteHandler = useCallback(
    async (success, result, error) => {
      console.log(
        "ℹ️ XXX: ~ useImageSubmission.ts ~ handleUploadComplete called",
        {
          success,
          result,
          error,
        },
      );

      setIsUploading(false);

      if (success && result) {
        console.log(
          "ℹ️ XXX: ~ useImageSubmission.ts ~ Upload successful, refreshing data",
        );
        setSubmissionError(null);

        // Check if new lines were completed and trigger confetti
        console.log(
          "ℹ️ XXX: ~ useImageSubmission.ts ~ Checking confetti conditions",
          {
            newlyCompletedLines: result.newlyCompletedLines,
            totalCompletedLines: result.totalCompletedLines,
            requiredBingoLines: result.requiredBingoLines,
            resultKeys: Object.keys(result),
          },
        );

        if (result.newlyCompletedLines > 0) {
          console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ Triggering confetti", {
            newlyCompletedLines: result.newlyCompletedLines,
            totalCompletedLines: result.totalCompletedLines,
            requiredBingoLines: result.requiredBingoLines,
          });

          // Trigger basic confetti for line completion
          confettiRef?.current?.fire({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
          });

          // Trigger fireworks if game is completed
          if (result.requiredBingoLines <= result.totalCompletedLines) {
            console.log(
              "ℹ️ XXX: ~ useImageSubmission.ts ~ Game completed! Triggering fireworks",
            );
            triggerFireworksConfetti();
          }
        }

        // Refresh data to show updated participant stats and submission history
        await Promise.all([refreshParticipants(), refreshSubmissions()]);
        console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ Data refresh completed");
      } else {
        console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ Upload failed", {
          error,
        });
        setSubmissionError(error || "Upload failed");
      }
    },
    [
      refreshParticipants,
      refreshSubmissions,
      setIsUploading,
      confettiRef,
      triggerFireworksConfetti,
    ],
  );

  /**
   * Handles start of image upload process
   * Clears previous errors and sets loading state
   */
  const handleUploadStart = useCallback(() => {
    console.log("ℹ️ XXX: ~ useImageSubmission.ts ~ handleUploadStart called");
    setIsUploading(true);
    setSubmissionError(null);
  }, [setIsUploading]);

  // Cleanup fireworks interval on unmount
  useEffect(() => {
    return () => {
      if (fireworksIntervalRef.current) {
        clearInterval(fireworksIntervalRef.current);
        fireworksIntervalRef.current = null;
      }
    };
  }, []);

  return {
    submissionError,
    handleUploadComplete,
    handleUploadStart,
  };
}
