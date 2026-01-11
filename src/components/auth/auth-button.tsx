"use client";

import { Github, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export function AuthButton() {
  const { user, loading, isAuthenticated, signInWithGithub, signOut } = useAuth();

  if (loading) {
    return <Skeleton className="w-9 h-9 rounded-full" />;
  }

  if (!isAuthenticated) {
    return (
      <Button variant="secondary" size="sm" onClick={signInWithGithub}>
        <Github size={16} className="mr-2" />
        Sign in
      </Button>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const email = user?.email;
  const initials = name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl} alt={name || "User avatar"} />
            <AvatarFallback className="bg-secondary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {name && <p className="text-sm font-medium">{name}</p>}
            {email && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
          <LogOut size={16} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
