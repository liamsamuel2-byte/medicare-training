import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emails } = await req.json() as { emails: string[] };
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) continue;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { results.skipped++; continue; }

    try {
      const tempPassword = Math.random().toString(36).slice(-10);
      const hashed = await bcrypt.hash(tempPassword, 12);
      const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      await prisma.user.create({ data: { email, name, password: hashed, role: "AGENT" } });
      results.created++;
    } catch {
      results.errors.push(email);
    }
  }

  return NextResponse.json(results);
}
