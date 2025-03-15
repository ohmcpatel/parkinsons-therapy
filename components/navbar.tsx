"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Image, PenTool, Activity, LineChart } from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Upload", href: "/upload", icon: Image },
  { name: "Gallery", href: "/gallery", icon: Image },
  { name: "Drawing", href: "/drawing", icon: PenTool },
  { name: "Calibration", href: "/calibration", icon: Activity },
  { name: "Analytics", href: "/analytics", icon: LineChart },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold">Parkinson's Therapy</span>
          </Link>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "flex items-center space-x-1",
                    isActive ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline-block">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
