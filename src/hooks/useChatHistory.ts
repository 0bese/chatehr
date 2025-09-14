import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useChatHistory() {
  const queryClient = useQueryClient()

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

  // Mutation for deleting chats
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
    isDeleting: deleteMutation.isPending,

    // Refetch function
    refetch: () => queryClient.invalidateQueries({ queryKey: chatKeys.lists() }),
  }
}