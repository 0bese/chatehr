import ChatInterface from "@/components/chat-interface";
import { FhirClientProvider } from "@/components/fhirClientContext";

export default function Home() {
  return (
    // <FhirClientProvider>
    <ChatInterface />
    // </FhirClientProvider>
  );
}
