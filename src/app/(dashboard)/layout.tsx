import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityBar } from "@/components/vscode/ActivityBar";
import { Sidebar } from "@/components/vscode/Sidebar";
import { TabBar } from "@/components/vscode/TabBar";
import { StatusBar } from "@/components/vscode/StatusBar";
import { Terminal } from "@/components/vscode/Terminal";
import { MobileNav } from "@/components/vscode/MobileNav";
import { RaffleNotifier } from "@/components/raffle/RaffleNotifier";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const participantCount = await prisma.raffleEntry.count();
  const isAdmin = session.user.role === "admin";

  return (
    <div className="vscode-shell">
      <div className="vscode-main">
        {/* Activity Bar — desktop only */}
        <ActivityBar />

        {/* Sidebar — desktop only */}
        <Sidebar isAdmin={isAdmin} />

        {/* Editor Area */}
        <div className="vscode-editor">
          <TabBar />
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              position: "relative",
            }}
          >
            <div className="grid-bg" style={{ minHeight: "100%" }}>
              {children}
            </div>
          </div>
          <Terminal />
          <StatusBar participantCount={participantCount} />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav isAdmin={isAdmin} />

      {/* Global raffle notifier — polls until draw, shows winner modal */}
      <RaffleNotifier currentUserId={session.user.id} />
    </div>
  );
}
