import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { UserModel as DbUser } from "@/generated/prisma/models";

export type Context = {
  prisma: typeof prisma;
  user: User | null;
  dbUser: DbUser | null;
};

export async function createContext(): Promise<Context> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbUser: DbUser | null = null;
  if (user) {
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });
  }

  return {
    prisma,
    user,
    dbUser,
  };
}
