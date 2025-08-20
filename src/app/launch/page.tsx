"use client";
import FHIR from "fhirclient";
import { useEffect } from "react";

export default function LaunchPage() {
  useEffect(() => {
    FHIR.oauth2.authorize({
      client_id: "6a5f11bd5b114d9c8c231be375d1911b",
      scope:
        "patient/*.* user/*.* launch launch/patient launch/encounter openid fhirUser profile offline_access",
      redirectUri: "http://localhost:3000",
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center space-x-4">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <h1 className="text-2xl font-semibold text-foreground">
          Redirecting...
        </h1>
      </div>
      <p className="mt-4 text-muted-foreground">
        Please wait while we redirect you to the Home page.
      </p>
    </div>
  );
}
