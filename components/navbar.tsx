"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Image as ImageIcon,
  PenTool,
  Activity,
  LineChart,
} from "lucide-react";
import Image from "next/image";
import logo from "../public/logo.png"; // Adjust the path if necessary

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
  { name: "Drawing", href: "/drawing", icon: PenTool },
  { name: "BigWrite", href: "/micro", icon: PenTool },
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
            <Image src={logo} alt="Logo" className="h-6 w-6" />
            <span className="font-bold">Tremor Trace</span>
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
