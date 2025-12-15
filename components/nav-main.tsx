"use client";

import { PlusCircleIcon, LogInIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Role = "teacher" | "student";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

export function NavMain({ items, role }: { items: NavItem[]; role: Role }) {
  const router = useRouter();
  const isTeacher = role === "teacher";

  const PrimaryIcon = isTeacher ? PlusCircleIcon : LogInIcon;
  const primaryLabel = isTeacher ? "Create Session" : "Join Session";

  const handlePrimaryClick = async () => {
    if (!isTeacher) {
      router.push("/session");
      return;
    }

    const res = await fetch("/api/sessions", { method: "POST" });
    if (!res.ok) {
      return;
    }

    const { session } = await res.json();
    console.log(session);

    router.push(`/sessions/${session.session_id}/edit`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {isTeacher ? (
              <SidebarMenuButton
                tooltip={primaryLabel}
                onClick={handlePrimaryClick}
                className="inline-flex w-auto bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <PrimaryIcon />
                <span>{primaryLabel}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                tooltip={primaryLabel}
                className="inline-flex w-auto bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link href="/session">
                  <PrimaryIcon />
                  <span>{primaryLabel}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
