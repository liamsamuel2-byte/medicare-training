import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const managerPassword = await bcrypt.hash("manager123", 12);
  await prisma.user.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: {
      email: "manager@company.com",
      name: "Training Manager",
      password: managerPassword,
      role: "MANAGER",
    },
  });

  console.log("Seed complete.");
  console.log("Admin:   admin@company.com / admin123");
  console.log("Manager: manager@company.com / manager123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
