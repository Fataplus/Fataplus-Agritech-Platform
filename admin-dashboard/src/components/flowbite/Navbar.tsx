"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import {
  HiMenuAlt1,
  HiSearch,
  HiBell,
  HiUserCircle,
} from "react-icons/hi";

export function FlowbiteNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-30 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-3">
              <HiMenuAlt1 className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link href="/" className="mr-14 flex items-center">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                  <span className="text-sm font-bold text-white">FP</span>
                </div>
                <span className="ml-2 whitespace-nowrap text-2xl font-semibold dark:text-white">
                  Fataplus
                </span>
              </div>
            </Link>
            <div className="hidden lg:block lg:pl-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full lg:w-96 pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <HiSearch className="h-6 w-6" />
                <span className="sr-only">Search</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HiBell className="h-6 w-6" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DarkModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <HiUserCircle className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <p className="text-sm">Admin User</p>
                    <p className="text-xs text-gray-500">admin@fata.plus</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}