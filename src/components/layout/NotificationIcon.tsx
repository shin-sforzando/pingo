"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { NotificationDrawer } from "./NotificationDrawer";

type NotificationIconProps = {
  hasUnreadNotifications?: boolean;
};

export function NotificationIcon({
  hasUnreadNotifications = false,
}: NotificationIconProps): ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsDrawerOpen(true)}
        aria-label={
          hasUnreadNotifications
            ? "You have unread notifications"
            : "Notifications"
        }
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnreadNotifications && (
          <span
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"
            aria-hidden="true"
            data-testid="unread-indicator"
          />
        )}
      </Button>
      <NotificationDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </>
  );
}
