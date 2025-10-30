"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Notification } from "@/types/schema";

type NotificationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationDrawer({
  open,
  onOpenChange,
}: NotificationDrawerProps): ReactElement {
  const t = useTranslations();

  // TODO: Implement actual notification fetching
  const notifications: Notification[] = [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("Header.notifications")}</DrawerTitle>
            <DrawerDescription>
              {t("Header.notificationsDescription")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4">
            {0 < notifications.length ? (
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`rounded-md border p-3 ${
                      !notification.read ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {t(`Notification.${notification.type.toLowerCase()}`)}:{" "}
                        {notification.message}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                {t("Header.noNotifications")}
              </p>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">{t("Common.close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
