import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { office: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <AppShell
      userName={dbUser.name}
      userEmail={dbUser.email}
      userRole={dbUser.role}
      officeName={dbUser.office.name}
    >
      {children}
    </AppShell>
  );
}
