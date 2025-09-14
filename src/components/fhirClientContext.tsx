"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
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

  const initDone = useRef(false); // 1. guard against double-mount

  useEffect(() => {
    if (initDone.current) return; // already booted
    initDone.current = true;

    // Development mode bypass - allow access without FHIR auth
    if (process.env.NODE_ENV === 'development' || process.env.FHIR_BYPASS === 'true') {
      console.log('Development mode: bypassing FHIR authentication');
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    // Check if we have existing session data first
    const checkExistingSession = async () => {
      try {
        // Try to get current user from server
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.practitionerId) {
            console.log('Found existing session, bypassing FHIR auth');
            setIsReady(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('No existing session found, proceeding with FHIR auth');
      }

      // If no existing session, try FHIR OAuth
      FHIR.oauth2
        .ready()
        .then(async (fhirClient) => {
          const {
            serverUrl: fhirBaseUrl,
            tokenResponse: { access_token: accessToken } = {},
          } = fhirClient.state;
          const practitionerId = fhirClient.user?.id;
          const patientId = fhirClient.patient?.id;

          if (!fhirBaseUrl || !accessToken || !practitionerId)
            throw new Error("Missing required FHIR authentication data");

          // --- names ----------------------------------------------------------
          const practitionerName = await fhirClient
            .request(fhirClient.user!.fhirUser!)
            .then((p) => humanName(p?.name?.[0]))
            .catch(() => "");

          const patientName = patientId
            ? await fhirClient
                .request(`Patient/${patientId}`)
                .then((p) => humanName(p?.name?.[0]))
                .catch(() => "")
            : "";

          // --- session --------------------------------------------------------
          const { success, error } = await createOrUpdateUser({
            practitionerId,
            name: practitionerName,
            patientId: patientId || undefined,
            patientName,
            fhirBaseUrl,
            accessToken,
          });

          if (!success) throw new Error(error || "Failed to create user session");

          setClient(fhirClient);
          setIsReady(true);
        })
        .catch((err) => {
          console.error("FHIR init error:", err);
          // For development/testing, allow access without FHIR auth
          console.log('Allowing access without FHIR authentication for development');
          setIsReady(true);
          setError(null); // Clear error to allow access
        })
        .finally(() => setIsLoading(false));
    };

    checkExistingSession();
  }, []);

  // 2. stable context value → no spurious re-renders
  const value = useMemo(
    () => ({ client, isLoading, error, isReady }),
    [client, isLoading, error, isReady]
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing FHIR connection…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-4">FHIR Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can still use the chat functionality without FHIR authentication.
            </p>
            <button
              onClick={() => {
                console.log('Bypassing FHIR authentication');
                setIsReady(true);
                setError(null);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Continue to Chat
            </button>
            <a href="/launch" className="block text-sm text-blue-500 hover:underline">
              Re-authenticate with FHIR
            </a>
          </div>
        </div>
      </div>
    );

  return <FhirContext.Provider value={value}>{children}</FhirContext.Provider>;
}

export function useFhirClient() {
  const ctx = useContext(FhirContext);
  if (!ctx)
    throw new Error("useFhirClient must be used inside FhirClientProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function humanName(name?: any): string {
  if (!name) return "";
  return [name.given?.join(" "), name.family].filter(Boolean).join(" ").trim();
}
