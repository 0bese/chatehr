"use client";

import * as React from "react";

export function Sidebar() {
  return (
    <div className="h-screen dark:bg-gray-800 w-64 dark:border-gray-700 p-2 transition-all">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold`}>ChatEHR</h2>
      </div>
      <nav className="mt-4">
        <ul>
          <li>
            <a
              href="/launch"
              className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
            >
              Launch
            </a>
          </li>
          <li>
            <a
              href="/"
              className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
            >
              Chat
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
