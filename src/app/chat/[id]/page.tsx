//chat/[id]/page.tsx
import { ChatView } from "@/components/chat/ChatView";
import { loadChat } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    return <div> No user</div>;
  }
  const messages = await loadChat({ id, practitionerId: user.practitionerId });

  if (id !== "new" && messages.length == 0) {
    return <div> Chat not found </div>;
  }

  return <ChatView id={id} initialMessages={id == "new" ? [] : messages} />;
}
