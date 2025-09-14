// app/chat/page.tsx
import { redirect } from "next/navigation";
import { createNewChat } from "@/lib/actions/chat-actions";
import { getCurrentUser } from "@/lib/auth";
import { ClientRedirect } from "@/components/ClientRedirect";

/**
 * Server component that handles the creation of new chats
 * When a user navigates to /chat without an ID, this creates a new chat
 * and redirects them to the specific chat URL
 */
export default async function NewChatPage() {
  const user = await getCurrentUser();
  console.log("NewChatPage - Current user:", user);

  if (!user?.practitionerId) {
    console.log(
      "NewChatPage - No user or practitionerId, redirecting to /launch"
    );
    redirect("/launch");
  }

  console.log(
    "NewChatPage - Creating new chat for practitioner:",
    user.practitionerId
  );

  // Create a new chat using server action
  const result = await createNewChat("New Chat");
  console.log("NewChatPage - Chat creation result:", result);

  if (!result.success || !result.chatId) {
    console.error("Failed to create chat:", result.error);
    redirect("/error?message=Failed to create chat session");
  }

  console.log("NewChatPage - Redirecting to /chat/" + result.chatId);

  // Return client-side redirect component instead of server redirect
  // This avoids the NEXT_REDIRECT error and provides better UX
  return <ClientRedirect url={`/chat/${result.chatId}`} />;
}

/**
 * Optional: Add metadata for SEO/page info
 */
export const metadata = {
  title: "New Chat",
  description: "Starting a new chat session",
};

/**
 * Optional: Force dynamic rendering if needed
 * This ensures the page doesn't get statically generated
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
