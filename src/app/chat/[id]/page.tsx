//chat/[id]/page.tsx
import { ChatView } from "@/components/chat/ChatView";
import { loadChat } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // Check user authentication first (this will redirect if needed)
  const user = await getCurrentUser();

  if (!user) {
    redirect("/launch");
  }

  if (!user.practitionerId) {
    redirect("/error?message=Invalid user session");
  }

  // Load chat messages
  const messages = await loadChat({
    id,
    practitionerId: user.practitionerId,
  });

  // Check if chat exists by trying to load the chat metadata first
  // Empty messages don't necessarily mean the chat doesn't exist - it could just be a new chat
  if (id !== "new") {
    // Try to verify chat access first (this will return empty array if chat doesn't exist)
    const { verifyChatAccess } = await import("@/lib/actions/chat");
    const chatExists = await verifyChatAccess({ id, practitionerId: user.practitionerId });

    if (!chatExists) {
      redirect("/error?message=Chat not found or you don't have access");
    }
  }

  return <ChatView id={id} initialMessages={id === "new" ? [] : messages} />;
}
