"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { oauth2 as FHIR } from "fhirclient";
import Client from "fhirclient/lib/Client";

export const FhirClientContext = createContext<{ client: Client | null }>({
  client: null,
});

export function useClient() {
  return useContext(FhirClientContext);
}

export function FhirClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    FHIR.ready()
      .then((client) => {
        setClient(client);
        fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: client.patient.id,
            accessToken: client.state.tokenResponse?.access_token,
            serverUrl: client.state.serverUrl,
          }),
        });
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  if (error) {
    console.error(error);
    return <div>Error: {error.message}</div>;
  }

  return (
    <FhirClientContext.Provider value={{ client }}>
      {children}
    </FhirClientContext.Provider>
  );
}
