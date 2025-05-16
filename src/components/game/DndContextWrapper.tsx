"use client";

import { DndContext, type DndContextProps } from "@dnd-kit/core";
import type { PropsWithChildren } from "react";

export interface IDndContextWrapper
  extends DndContextProps,
    PropsWithChildren {}

export default function DndContextWrapper(props: IDndContextWrapper) {
  return <DndContext {...props} />;
}
