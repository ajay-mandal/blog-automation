"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/types";

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { success: false, error: "Password is required" };
  }

  if (parsed.data.password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Invalid password" };
  }

  const cookieStore = await cookies();
  cookieStore.set("session", process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Session cookie — expires when browser closes
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
