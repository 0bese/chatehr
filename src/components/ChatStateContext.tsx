"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatStateContextType {
  messageCount: number;
  setMessageCount: (count: number) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export function ChatStateProvider({ children }: { children: ReactNode }) {
  const [messageCount, setMessageCount] = useState(0);

  return (
    <ChatStateContext.Provider value={{ messageCount, setMessageCount }}>
      {children}
    </ChatStateContext.Provider>
  );
}

export function useCurrentChatState() {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error('useCurrentChatState must be used within a ChatStateProvider');
  }
  return context;
}

/**
 * Safe version of useCurrentChatState that returns default values when used outside ChatStateProvider
 */
export function useCurrentChatStateSafe(): ChatStateContextType {
  const context = useContext(ChatStateContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      messageCount: 0,
      setMessageCount: () => {},
    };
  }
  return context;
}