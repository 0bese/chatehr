import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { chatKeys } from './useChatHistory'
import { createNewChat } from '@/lib/actions/chat-actions'

export function useChatCreation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (title?: string) => {
      const result = await createNewChat(title || 'New Chat')
      if (!result.success) {
        throw new Error(result.error || 'Failed to create chat')
      }
      return result
    },
    onMutate: async () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: chatKeys.lists() })
    },
    onSuccess: (result) => {
      if (result.success && result.chatId) {
        // Log success (you can replace with your notification system)
        console.log('Chat created successfully')

        // Invalidate and refetch chat list to include the new chat
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() })

        // Navigate to the new chat
        router.push(`/chat/${result.chatId}`)
      }
    },
    onError: (error) => {
      console.error('Chat creation failed:', error)
      // You can integrate your notification system here
      alert('Failed to create chat. Please try again.')
    },
  })
}