import type { ConfettiRef } from "@/components/magicui/confetti";
import type { CompletedLine } from "@/types/schema";
import { useEffect, useRef } from "react";
import { usePrevious } from "./usePrevious";

interface UseConfettiEffectsProps {
  completedLines: CompletedLine[];
  requiredBingoLines: number;
}

/**
 * Hook for managing confetti effects based on bingo game progress
 * Triggers different confetti animations for line completion and game completion
 */
export function useConfettiEffects({
  completedLines,
  requiredBingoLines,
}: UseConfettiEffectsProps) {
  const confettiRef = useRef<ConfettiRef>(null);
  const prevCompletedCount = usePrevious(completedLines.length);

  useEffect(() => {
    const currentCompletedCount = completedLines.length;

    // Skip effect on initial render or when count decreases
    if (
      prevCompletedCount === undefined ||
      currentCompletedCount <= (prevCompletedCount || 0)
    ) {
      return;
    }

    // New line completed - trigger basic confetti
    if ((prevCompletedCount || 0) < currentCompletedCount) {
      confettiRef.current?.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
      });

      // Game completed - trigger fireworks confetti
      if (requiredBingoLines <= currentCompletedCount) {
        triggerFireworksConfetti();
      }
    }
  }, [completedLines.length, prevCompletedCount, requiredBingoLines]);

  /**
   * Triggers spectacular fireworks confetti for game completion
   * Creates multiple bursts over time for enhanced celebration effect
   */
  const triggerFireworksConfetti = () => {
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

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side firework
      confettiRef.current?.fire({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Right side firework
      confettiRef.current?.fire({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  return confettiRef;
}
