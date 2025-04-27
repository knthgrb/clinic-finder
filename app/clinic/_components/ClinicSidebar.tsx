"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calendar,
  Users,
  Building,
  UserCog,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/common/Logo";

interface ClinicSidebarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export default function ClinicSidebar({
  isMobileMenuOpen,
  toggleMobileMenu,
}: ClinicSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  const navigationItems = [
    {
      id: "appointments",
      name: "Appointments",
      icon: <Calendar className="h-5 w-5" />,
      path: "/clinic/appointments",
    },
    {
      id: "queue",
      name: "Queue Management",
      icon: <Users className="h-5 w-5" />,
      path: "/clinic/queue-management",
    },
    {
      id: "profile",
      name: "Clinic Profile",
      icon: <Building className="h-5 w-5" />,
      path: "/clinic/clinic-profile",
    },
    {
      id: "doctors",
      name: "Doctors",
      icon: <UserCog className="h-5 w-5" />,
      path: "/clinic/doctors",
    },
    {
      id: "messages",
      name: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      path: "/clinic/messages",
      notification: unreadCount && unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:w-64 bg-gray-50 border-r border-gray-200 h-full flex-col">
        <div className="h-14 p-0 flex items-center border-b border-gray-200">
          <div className="px-4 flex h-full items-center">
            <Logo />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md relative ${
                    pathname === item.path
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                  {item.notification && (
                    <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.notification}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile overlay menu - shown when menu is open */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-40"
          onClick={toggleMobileMenu}
        >
          <div
            className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <Logo />
              <button onClick={toggleMobileMenu} className="text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {navigationItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        router.push(item.path);
                        toggleMobileMenu();
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md relative ${
                        pathname === item.path
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                      {item.notification && (
                        <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.notification}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
