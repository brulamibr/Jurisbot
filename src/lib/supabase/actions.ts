"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";
import { prisma } from "@/lib/prisma";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const officeName = formData.get("officeName") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, office_name: officeName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const slug = officeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const office = await prisma.office.create({
      data: {
        name: officeName,
        slug: `${slug}-${Date.now().toString(36)}`,
        email,
      },
    });

    await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        officeId: office.id,
        email,
        name,
        role: "ADMIN",
      },
    });
  }

  redirect("/login?registered=true");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
