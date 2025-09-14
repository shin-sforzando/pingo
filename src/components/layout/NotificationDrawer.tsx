"use client";

import { faker } from "@faker-js/faker";
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
import { NotificationDisplayType, NotificationType } from "@/types/common";
import type { Notification } from "@/types/schema";

type NotificationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Dummy notifications data
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: faker.string.ulid(),
    type: NotificationType.GAME_INVITATION,
    displayType: NotificationDisplayType.TOAST,
    message: "「東京の風景」",
    createdAt: new Date(2025, 4, 14, 9, 30),
    read: false,
    relatedGameId: faker.string.alpha({ casing: "upper", length: 6 }),
  },
  {
    id: faker.string.ulid(),
    type: NotificationType.GAME_ENDED,
    displayType: NotificationDisplayType.POPUP,
    message: "「大阪グルメツアー」",
    createdAt: new Date(2025, 4, 13, 18, 15),
    read: true,
    relatedGameId: faker.string.alpha({ casing: "upper", length: 6 }),
  },
];

export function NotificationDrawer({
  open,
  onOpenChange,
}: NotificationDrawerProps): ReactElement {
  const t = useTranslations();
  const headerT = useTranslations("Header");
  const commonT = useTranslations("Common");

  // Using dummy data
  const notifications = DUMMY_NOTIFICATIONS;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{headerT("notifications")}</DrawerTitle>
            <DrawerDescription>
              {headerT("notificationsDescription")}
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
                {headerT("noNotifications")}
              </p>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">{commonT("close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
