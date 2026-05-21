import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const BASE_URL = process.env.NEXTAUTH_URL || "https://medicare-training-git-main-liamswilkes-7489s-projects.vercel.app";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // don't reveal if email exists

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (user) {
    // Expire any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    const resetUrl = `${BASE_URL}/reset-password/${token.token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Medicare Training Portal" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1e3a5f">Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin-top:8px;background:#1d4ed8;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            If you didn't request this, you can safely ignore this email.<br/>
            NSBA Group — Medicare Training Portal
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
