// app/chat/page.tsx
import { redirect } from "next/navigation";
import { createChat } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server component that handles the creation of new chats
 * When a user navigates to /chat without an ID, this creates a new chat
 * and redirects them to the specific chat URL
 */
export default async function NewChatPage() {
  let chatId: string;

  try {
    const user = await getCurrentUser();
    if (!user?.practitionerId) {
      redirect("/launch");
    }
    // Create a new chat and get the generated ID
    chatId = await createChat({ practitionerId: user.practitionerId });
  } catch (error) {
    console.error("Failed to create new chat:", error);
    throw new Error("Failed to create new chat session");
  }

  // Redirect to the specific chat page with the new ID
  // redirect() throws internally to perform the redirect - this is expected
  redirect(`/chat/${chatId}`);
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
