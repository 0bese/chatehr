import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchUserChats,
  deleteChatAction,
  togglePinChatAction
} from '@/lib/actions/chat-actions'
import { InferSelectModel } from 'drizzle-orm'
import { chats } from '@/lib/db/schema/chat'

export type Chat = InferSelectModel<typeof chats>

// Query key factory
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
}

export function useChatHistory(currentChatId?: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isNavigatingAfterDelete, setIsNavigatingAfterDelete] = useState(false)

  // Query for fetching chats
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: chatKeys.lists(),
    queryFn: async () => {
      const result = await fetchUserChats()
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for pinning/unpinning chats
  const pinMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const result = await togglePinChatAction(chatId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async (chatId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.lists() })

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.lists())

      // Optimistically update to the new value
      queryClient.setQueryData<Chat[]>(chatKeys.lists(), (old) =>
        old?.map(chat =>
          chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
        ) ?? []
      )

      // Return a context object with the snapshotted value
      return { previousChats }
    },
    onError: (err, chatId, context) => {
      // Roll back to the previous value on error
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.lists(), context.previousChats)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })

  // Mutation for deleting chats with navigation logic
  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const result = await deleteChatAction(chatId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onMutate: async (chatId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.lists() })

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.lists())

      // Optimistically remove the chat
      queryClient.setQueryData<Chat[]>(chatKeys.lists(), (old) =>
        old?.filter(chat => chat.id !== chatId) ?? []
      )

      // Return a context object with the snapshotted value
      return { previousChats }
    },
    onError: (err, chatId, context) => {
      // Roll back to the previous value on error
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.lists(), context.previousChats)
      }
    },
    onSuccess: (result, deletedChatId) => {
      // Handle navigation after successful deletion
      if (currentChatId === deletedChatId) {
        setIsNavigatingAfterDelete(true)

        // Get remaining chats after deletion
        const remainingChats = queryClient.getQueryData<Chat[]>(chatKeys.lists()) || []
        const filteredChats = remainingChats.filter(chat => chat.id !== deletedChatId)

        if (filteredChats.length > 0) {
          // Prioritize navigation:
          // 1. First pinned chat (most recent)
          // 2. First unpinned chat (most recent)
          // 3. Create new chat if none available
          const pinnedChats = filteredChats.filter(chat => chat.pinned)
          const unpinnedChats = filteredChats.filter(chat => !chat.pinned)

          let targetChat: Chat | null = null

          if (pinnedChats.length > 0) {
            targetChat = pinnedChats[0] // Most recent pinned chat
          } else if (unpinnedChats.length > 0) {
            targetChat = unpinnedChats[0] // Most recent unpinned chat
          }

          if (targetChat) {
            router.push(`/chat/${targetChat.id}`)
          } else {
            // Fallback: create new chat
            router.push('/chat/new')
          }
        } else {
          // No chats left, navigate to new chat
          router.push('/chat/new')
        }

        // Reset navigation state after a short delay
        setTimeout(() => setIsNavigatingAfterDelete(false), 1000)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })

  return {
    // Data
    chats: data ?? [],
    isLoading,
    isFetching,
    error,

    // Mutations
    pinChat: pinMutation.mutate,
    isPinning: pinMutation.isPending,
    deleteChat: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending || isNavigatingAfterDelete,

    // Navigation state
    isNavigatingAfterDelete,

    // Refetch function
    refetch: () => queryClient.invalidateQueries({ queryKey: chatKeys.lists() }),
  }
}