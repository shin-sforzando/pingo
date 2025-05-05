"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function UserMenu() {
  const t = useTranslations("Header");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src="/avatar-placeholder.png" alt="User" />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">User Name</h4>
            <p className="text-sm text-muted-foreground">user@example.com</p>
          </div>
          <Separator />
          <div className="grid gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <User className="mr-2 h-4 w-4" />
              {t("profileSettings")}
            </Button>
            <LanguageSwitcher />
            <Separator />
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
