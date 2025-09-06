"use client";

import { createContext, useContext, useEffect, useState } from "react";
import FHIR from "fhirclient";
import Client from "fhirclient/lib/Client";
import { createOrUpdateUser } from "@/lib/actions/auth";

interface FhirContextType {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
}

const FhirContext = createContext<FhirContextType>({
  client: null,
  isLoading: true,
  error: null,
  isReady: false,
});

export function FhirClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeFhirClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize FHIR client
        const fhirClient = await FHIR.oauth2.ready();

        // Extract required information
        const fhirBaseUrl = fhirClient.state.serverUrl;
        const accessToken = fhirClient.state.tokenResponse?.access_token;
        const practitionerId = fhirClient.user?.id;
        const patientId = fhirClient.patient?.id;
        const encounterId = fhirClient.encounter?.id;

        // Validate required data
        if (!fhirBaseUrl || !accessToken || !practitionerId) {
          throw new Error("Missing required FHIR authentication data");
        }

        // Get practitioner name if possible
        let practitionerName: string = "";
        try {
          if (fhirClient.user?.fhirUser) {
            const practitioner = await fhirClient.request(
              fhirClient.user.fhirUser
            );
            if (practitioner?.name?.[0]) {
              const name = practitioner.name[0];
              practitionerName = `${name.given?.join(" ") || ""} ${
                name.family || ""
              }`.trim();
            }
          }
        } catch (nameError) {
          console.warn("Could not fetch practitioner name:", nameError);
        }

        // Get patient name if possible
        let patientName: string = "";
        try {
          if (fhirClient.user?.fhirUser) {
            const patient = await fhirClient.request(`Patient/${patientId}`);
            if (patient?.name?.[0]) {
              const name = patient.name[0];
              patientName = `${name.given?.join(" ") || ""} ${
                name.family || ""
              }`.trim();
            }
          }
          console.log(patientName);
        } catch (nameError) {
          console.warn("Could not fetch patient name:", nameError);
        }

        // Create or update user and session
        const result = await createOrUpdateUser({
          practitionerId,
          name: practitionerName,
          patientId: patientId || undefined,
          patientName: patientName,
          fhirBaseUrl,
          accessToken,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to create user session");
        }

        setClient(fhirClient);
        setIsReady(true);
      } catch (err) {
        console.error("FHIR initialization error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize FHIR client"
        );
      } finally {
        setIsLoading(false);
        console.log(isLoading);
      }
    };

    initializeFhirClient();
  }, []);

  const value: FhirContextType = {
    client,
    isLoading,
    error,
    isReady,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing FHIR connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Error: {error}
      </div>
    );
  }

  return <FhirContext.Provider value={value}>{children}</FhirContext.Provider>;
}

export function useFhirClient() {
  const context = useContext(FhirContext);
  if (!context) {
    throw new Error("useFhirClient must be used within a FhirClientProvider");
  }
  return context;
}
