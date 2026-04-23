"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, BarChart2, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart2 },
];

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-900 text-white px-6 py-0 flex items-center gap-1">
      <div className="py-2 pr-8 border-r border-blue-700 flex items-center gap-3">
        <Image src="/nsba-logo.png" alt="NSBA Logo" width={44} height={44} className="rounded-full" />
        <div>
          <span className="font-bold text-sm block leading-tight">Medicare Training</span>
          <span className="text-xs bg-blue-700 px-2 py-0.5 rounded text-blue-200">Admin</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-1 px-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition ${
                active
                  ? "border-white text-white"
                  : "border-transparent text-blue-300 hover:text-white hover:border-blue-400"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 py-4">
        <span className="text-blue-200 text-sm">{userName}</span>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition"
        >
          <LogOut size={15} /> Sign out
        </Link>
      </div>
    </nav>
  );
}
