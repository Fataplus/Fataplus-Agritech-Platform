"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  HiChartPie,
  HiUsers,
  HiCog,
  HiServer,
  HiChip,
  HiDatabase,
  HiPresentationChartBar,
  HiUserCircle,
} from "react-icons/hi";

const navigation = [
  { name: 'Dashboard', href: '/', icon: HiChartPie },
  { name: 'Users', href: '/users', icon: HiUsers },
  { name: 'AI Services', href: '/ai-services', icon: HiChip },
  { name: 'Context', href: '/context', icon: HiDatabase },
  { name: 'Server', href: '/server', icon: HiServer },
  { name: 'Analytics', href: '/analytics', icon: HiPresentationChartBar },
  { name: 'Settings', href: '/settings', icon: HiCog },
];

export function FlowbiteSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden h-full w-64 flex-col border-r border-gray-200 bg-white pt-16 lg:flex dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-full flex-col justify-between">
        <div className="py-2">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <IconComponent className="h-5 w-5" />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center">
            <HiUserCircle className="h-8 w-8 text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@fata.plus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}