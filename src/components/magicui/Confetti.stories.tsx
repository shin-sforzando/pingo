import type { Meta, StoryObj } from "@storybook/nextjs";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "./confetti";

const meta: Meta<typeof Confetti> = {
  title: "MagicUI/Confetti",
  component: Confetti,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic confetti effect demonstration
 */
export const Basic: Story = {
  render: () => {
    const confettiRef = useRef<ConfettiRef>(null);

    const handleBasicConfetti = () => {
      confettiRef.current?.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
      });
    };

    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50">
        <Confetti
          ref={confettiRef}
          className="pointer-events-none fixed inset-0 z-50"
          manualstart
        />
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 font-bold text-2xl">Basic Confetti Effect</h2>
            <p className="mb-6 text-gray-600">
              Click the button to trigger a basic confetti celebration
            </p>
            <Button onClick={handleBasicConfetti} size="lg">
              🎉 Trigger Basic Confetti
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Fireworks confetti effect demonstration
 */
export const Fireworks: Story = {
  render: () => {
    const confettiRef = useRef<ConfettiRef>(null);

    const handleFireworksConfetti = () => {
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

    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-purple-50 to-pink-50">
        <Confetti
          ref={confettiRef}
          className="pointer-events-none fixed inset-0 z-50"
          manualstart
        />
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 font-bold text-2xl">
              Fireworks Confetti Effect
            </h2>
            <p className="mb-6 text-gray-600">
              Click the button to trigger spectacular fireworks celebration
            </p>
            <Button
              onClick={handleFireworksConfetti}
              size="lg"
              variant="secondary"
            >
              🎆 Trigger Fireworks
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Bingo game simulation with confetti effects
 */
export const BingoSimulation: Story = {
  render: () => {
    const confettiRef = useRef<ConfettiRef>(null);

    const handleLineComplete = () => {
      confettiRef.current?.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
      });
    };

    const handleGameComplete = () => {
      // First trigger basic confetti
      confettiRef.current?.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
      });

      // Then trigger fireworks
      setTimeout(() => {
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

          confettiRef.current?.fire({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });

          confettiRef.current?.fire({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      }, 500);
    };

    return (
      <div className="relative h-screen w-full bg-gradient-to-br from-green-50 to-blue-50">
        <Confetti
          ref={confettiRef}
          className="pointer-events-none fixed inset-0 z-50"
          manualstart
        />
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 font-bold text-2xl">Bingo Game Celebrations</h2>
            <p className="mb-6 text-gray-600">
              Simulate bingo game celebrations with different confetti effects
            </p>
            <div className="space-x-4">
              <Button onClick={handleLineComplete} size="lg" variant="outline">
                📋 Line Complete
              </Button>
              <Button onClick={handleGameComplete} size="lg">
                🏆 Game Complete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
