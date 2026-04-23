import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendReminderEmail({
  to,
  name,
  projects,
}: {
  to: string;
  name: string;
  projects: string[];
}) {
  const projectList = projects.map((p) => `• ${p}`).join("\n");

  await transporter.sendMail({
    from: `"Medicare Training Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reminder: You have incomplete training",
    text: `Hi ${name},\n\nThis is a reminder that you have outstanding training to complete:\n\n${projectList}\n\nPlease log in to complete your training at your earliest convenience.\n\nThank you,\nNSBA Group`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <img src="https://medicare-training-git-main-liamswilkes-7489s-projects.vercel.app/nsba-logo.png" alt="NSBA" width="48" style="border-radius:50%;margin-bottom:16px" />
        <h2 style="color:#1e3a5f;margin:0 0 8px">Training Reminder</h2>
        <p style="color:#444">Hi ${name},</p>
        <p style="color:#444">You have outstanding training that needs to be completed:</p>
        <ul style="color:#1d4ed8;padding-left:20px">
          ${projects.map((p) => `<li style="margin-bottom:4px">${p}</li>`).join("")}
        </ul>
        <a href="https://medicare-training-git-main-liamswilkes-7489s-projects.vercel.app/dashboard"
           style="display:inline-block;margin-top:16px;background:#1d4ed8;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Go to Training Portal
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">NSBA Group — Medicare Training Portal</p>
      </div>
    `,
  });
}
