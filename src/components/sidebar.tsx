"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <div
      className={cn(
        "h-screen  dark:border-gray-700 p-2 transition-all duration-200 ease-in-out overflow-hidden",
        {
          "w-64": !collapsed,
          "w-0 p-0": collapsed,
        }
      )}
    >
      <div className="flex items-center justify-between h-14">
        <h2 className={`text-xl font-semibold ml-14`}>ChatEHR</h2>
      </div>
      <nav className="mt-4">
        <ul>
          <li>
            <a
              href="/launch"
              className="block p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md"
            >
              Launch
            </a>
          </li>
          <li>
            <a
              href="/"
              className="block p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md"
            >
              Chat
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F31] rounded-md"
            >
              Collections
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
