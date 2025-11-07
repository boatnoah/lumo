"use client";

import {
  MailIcon,
  PlusCircleIcon,
  LogInIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
  const isTeacher = role === "teacher";

  const PrimaryIcon = isTeacher ? PlusCircleIcon : LogInIcon;
  const primaryLabel = isTeacher ? "Create Session" : "Join Session";
  const primaryHref = isTeacher ? "/sessions/new" : "/join";

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              tooltip={primaryLabel}
              className="inline-flex w-auto bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground w-500"
            >
              <Link href={primaryHref}>
                <PrimaryIcon />
                <span>{primaryLabel}</span>
              </Link>
            </SidebarMenuButton>
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
