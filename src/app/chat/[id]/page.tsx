import ChatInterface from "@/components/chat-interface";
import { FhirClientProvider } from "@/components/fhirClientContext";
import { loadChat } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/auth";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = getCurrentUser();
  const messages = await loadChat({ id, practitionerId: user.practitionerId });

  return (
    //   <FhirClientProvider>
    <ChatInterface id={id} initialMessages={messages} />
    //   </FhirClientProvider>
  );
}
