"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function UserMenu() {
  const t = useTranslations("Header");
  const { user, userProfile, logout } = useAuth();
  // Debug log to check userProfile data
  console.log("ℹ️ XXX: ~ UserMenu.tsx ~ UserMenu ~ userProfile:", userProfile);
  const [isOpen, setIsOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Switch between login and register forms
  const toggleForm = () => {
    setShowRegister(!showRegister);
  };

  // Close popover after successful login/register
  const handleAuthSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer" data-testid="my-avatar">
          {user ? (
            <>
              <AvatarImage
                src="https://avatar.iran.liara.run/public"
                alt="User"
              />
              <AvatarFallback>
                {userProfile?.username?.[0] || "Unknown"}
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage
                src="/images/guest-avatar-placeholder.png"
                alt="Guest"
              />
              <AvatarFallback>GU</AvatarFallback>
            </>
          )}
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {user ? (
          // Authenticated user view
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {userProfile?.username || "Unknown"}
              </h4>
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
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </Button>
            </div>
          </div>
        ) : (
          // Unauthenticated user view - show login or register form
          <div>
            {showRegister ? (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onLoginClick={toggleForm}
              />
            ) : (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onRegisterClick={toggleForm}
              />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
