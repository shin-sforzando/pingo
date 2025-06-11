"use client";

import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";
import type { ReactNode } from "react";
import type React from "react";
import {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { Button } from "@/components/ui/button";

type Api = {
  fire: (options?: ConfettiOptions) => void;
};

type Props = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

export type ConfettiRef = Api | null;

const ConfettiContext = createContext<Api>({} as Api);

// Define component first
const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    ...rest
  } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const globalOptionsRef = useRef(globalOptions);
  globalOptionsRef.current = globalOptions;

  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    console.log("ℹ️ XXX: ~ confetti.tsx ~ canvasRef callback", {
      nodeExists: !!node,
      instanceExists: !!instanceRef.current,
    });

    if (node !== null) {
      if (instanceRef.current) {
        console.log(
          "ℹ️ XXX: ~ confetti.tsx ~ Instance already exists, skipping creation",
        );
        return;
      }

      console.log("ℹ️ XXX: ~ confetti.tsx ~ Creating confetti instance");

      // Set canvas size to full viewport
      node.width = window.innerWidth;
      node.height = window.innerHeight;

      instanceRef.current = confetti.create(node, {
        resize: true,
        useWorker: true,
        ...globalOptionsRef.current,
      });
      console.log("ℹ️ XXX: ~ confetti.tsx ~ Confetti instance created", {
        instanceExists: !!instanceRef.current,
      });
    } else {
      console.log("ℹ️ XXX: ~ confetti.tsx ~ Node is null, cleaning up instance");
      if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
        console.log("ℹ️ XXX: ~ confetti.tsx ~ Instance cleaned up");
      }
    }
  }, []);

  const fire = useCallback(
    async (opts = {}) => {
      console.log("ℹ️ XXX: ~ confetti.tsx ~ fire() called", {
        instanceExists: !!instanceRef.current,
        options,
        opts,
        mergedOptions: { ...options, ...opts },
      });

      try {
        if (!instanceRef.current) {
          console.warn(
            "ℹ️ XXX: ~ confetti.tsx ~ No confetti instance available",
          );
          return;
        }

        const result = await instanceRef.current({ ...options, ...opts });
        console.log("ℹ️ XXX: ~ confetti.tsx ~ Confetti fired successfully", {
          result,
        });
      } catch (error) {
        console.error("ℹ️ XXX: ~ confetti.tsx ~ Confetti error:", error);
      }
    },
    [options],
  );

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire],
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    console.log("ℹ️ XXX: ~ confetti.tsx ~ useEffect for auto-fire", {
      manualstart,
      shouldAutoFire: !manualstart,
    });

    if (!manualstart) {
      console.log("ℹ️ XXX: ~ confetti.tsx ~ Auto-firing confetti");
      (async () => {
        try {
          await fire();
        } catch (error) {
          console.error(
            "ℹ️ XXX: ~ confetti.tsx ~ Confetti effect error:",
            error,
          );
        }
      })();
    }
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

// Set display name immediately
ConfettiComponent.displayName = "Confetti";

// Export as Confetti
export const Confetti = ConfettiComponent;

interface ConfettiButtonProps extends React.ComponentProps<typeof Button> {
  options?: ConfettiOptions &
    ConfettiGlobalOptions & { canvas?: HTMLCanvasElement };
  children?: React.ReactNode;
}

const ConfettiButtonComponent = ({
  options,
  children,
  ...props
}: ConfettiButtonProps) => {
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      await confetti({
        ...options,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      });
    } catch (error) {
      console.error("Confetti button error:", error);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

ConfettiButtonComponent.displayName = "ConfettiButton";

export const ConfettiButton = ConfettiButtonComponent;
