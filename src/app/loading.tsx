"use client";

import { HyperText } from "@/components/magicui/hyper-text";

/**
 * Global loading component for the application
 * Displays an animated loading text using HyperText component
 */
export default function Loading() {
  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center py-8">
      <HyperText
        className="text-center font-bold text-4xl md:text-6xl"
        duration={1200}
      >
        Loading...
      </HyperText>
    </div>
  );
}
