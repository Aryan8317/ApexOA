"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut: () => Promise<void>;
}

export default function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const isHomeActive = pathname === "/dashboard";
  const isInterviewsActive = pathname.startsWith("/dashboard/new") || pathname.includes("/interview/");

  return (
    <>
      {/* SideNavBar for Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface-cream dark:bg-surface-dim shadow-md flex-col p-6 gap-2 z-40 border-r border-outline-variant/30">
        {/* Brand Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed-dim tracking-tight">
              ApexOA
            </h1>
          </Link>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Interview Coach
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2 flex-grow">
          {/* Home Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 font-label-md text-label-md transition-all duration-300 ${
              isHomeActive
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isHomeActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              home
            </span>
            Home
          </Link>

          {/* Interviews Link */}
          <Link
            href="/dashboard/new"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 font-label-md text-label-md transition-all duration-300 ${
              isInterviewsActive
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isInterviewsActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              video_chat
            </span>
            Interviews
          </Link>

          {/* Inactive Tabs */}
          <div className="flex items-center gap-3 text-on-surface-variant/40 px-4 py-3 rounded-lg font-label-md text-label-md cursor-not-allowed">
            <span className="material-symbols-outlined">library_books</span>
            Resources
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant/40 px-4 py-3 rounded-lg font-label-md text-label-md cursor-not-allowed">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </div>
        </div>

        {/* CTA & User Profile Area */}
        <div className="mt-auto flex flex-col gap-4">
          <Link href="/dashboard/new" className="w-full">
            <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors duration-300 shadow-sm flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Session
            </button>
          </Link>

          <div className="flex flex-col gap-2 mt-2 border-t border-outline-variant pt-4">
            <div className="flex items-center gap-3 p-1">
              <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden flex-shrink-0 border-2 border-surface-white">
                {user?.image ? (
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src={user.image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-on-primary font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="font-label-md text-label-md text-on-surface truncate">
                  {user?.name || "User"}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Pro Plan
                </span>
              </div>
            </div>
            
            <button
              onClick={() => onSignOut()}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden w-full px-margin-mobile py-4 flex justify-between items-center bg-surface-cream/70 backdrop-blur-xl fixed top-0 z-50 border-b border-glass-border">
        <Link href="/dashboard" className="font-headline-sm text-headline-sm font-bold text-primary">
          ApexOA
        </Link>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSignOut()}
            className="text-red-600 p-2 hover:bg-red-50 rounded-full"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
    </>
  );
}
