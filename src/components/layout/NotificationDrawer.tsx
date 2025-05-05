"use client";

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
import { useTranslations } from "next-intl";

type NotificationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationDrawer({
  open,
  onOpenChange,
}: NotificationDrawerProps) {
  const t = useTranslations("Header");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("notifications")}</DrawerTitle>
            <DrawerDescription>
              {t("notificationsDescription")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
