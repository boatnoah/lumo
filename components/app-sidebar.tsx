"use client";

import * as React from "react";
import {
  Circle,
  ClipboardListIcon,
  DatabaseIcon,
  FileIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type AppSidebarUser = {
  name: string;
  role: string;
  avatar: string;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser;
};

type Role = "teacher" | "student";

export const navConfig: Record<
  Role,
  {
    navMain: { title: string; url: string; icon: any }[];
    navSecondary: { title: string; url: string; icon: any }[];
    documents: { name: string; url: string; icon: any }[];
  }
> = {
  teacher: {
    navMain: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
      { title: "Sessions", url: "/sessions", icon: ListIcon }, // view + manage
      { title: "New Session", url: "/sessions/new", icon: FolderIcon }, // create
      { title: "Students", url: "/students", icon: UsersIcon },
    ],
    navSecondary: [
      { title: "Settings", url: "/settings", icon: SettingsIcon },
      { title: "Get Help", url: "/help", icon: HelpCircleIcon },
      { title: "Search", url: "/search", icon: SearchIcon },
    ],
    documents: [
      { name: "Session Library", url: "/sessions/library", icon: DatabaseIcon },
      { name: "Reports", url: "/reports", icon: ClipboardListIcon },
      { name: "Resources", url: "/resources", icon: FileIcon },
    ],
  },

  student: {
    navMain: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
      { title: "Join Session", url: "/join", icon: ListIcon },
      { title: "My Sessions", url: "/sessions", icon: FolderIcon }, // view past + active
    ],
    navSecondary: [
      { title: "Settings", url: "/settings", icon: SettingsIcon },
      { title: "Get Help", url: "/help", icon: HelpCircleIcon },
    ],
    documents: [
      {
        name: "Past Sessions",
        url: "/sessions/history",
        icon: ClipboardListIcon,
      },
      { name: "Course Materials", url: "/materials", icon: FileIcon },
    ],
  },
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const role = user.role as Role;
  const data = navConfig[role];
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Circle className="h-5 w-5 animate-pulse" />
                <span className="text-base font-semibold">Lumo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} role={role} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
