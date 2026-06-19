import { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="bg-background min-h-screen flex font-body-md text-on-background selection:bg-primary-container selection:text-on-primary-container">
      {/* Sidebar Navigation */}
      <Sidebar user={session?.user || null} onSignOut={handleSignOut} />

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop pt-24 md:pt-margin-desktop w-full max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
