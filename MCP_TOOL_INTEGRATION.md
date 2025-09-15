# MCP Tool User Context Integration

This document explains how MCP tools can access user context information that's automatically injected by the ChatEHR system.

## Overview

When MCP tools are executed through the ChatEHR system, user context information is automatically injected into the tool input. This allows FHIR tools to access practitioner and patient information, authentication tokens, and other relevant context.

## User Context Structure

The user context is injected as `_userContext` in the tool input parameter:

```typescript
interface UserContext {
  practitionerId: string;        // FHIR practitioner ID
  practitionerName?: string;     // Practitioner display name
  patientId?: string;            // Current patient ID (if applicable)
  patientName?: string;          // Current patient name (if applicable)
  fhirBaseUrl: string;           // FHIR server base URL
  accessToken: string;           // Authentication token
  timestamp: string;             // ISO timestamp of request
}
```

## Tool Implementation Example

Here's how to create an MCP tool that uses user context:

```typescript
// Example FHIR Patient Search Tool
export const patientSearchTool = {
  name: "fhir_search_patients",
  description: "Search for patients in the FHIR server",
  schema: {
    type: "object",
    properties: {
      searchQuery: {
        type: "string",
        description: "Search query for patient name or identifier"
      },
      includeInactive: {
        type: "boolean",
        description: "Include inactive patients in results",
        default: false
      }
    },
    required: ["searchQuery"]
  },

  execute: async (input: any) => {
    // Access user context
    const userContext = input._userContext;

    if (!userContext) {
      throw new Error("User context not available. This tool must be called through ChatEHR.");
    }

    const {
      fhirBaseUrl,
      accessToken,
      practitionerId,
      patientId
    } = userContext;

    // Example: Build FHIR search parameters
    const searchParams = new URLSearchParams({
      name: input.searchQuery,
      _sort: "name",
      _count: "20"
    });

    if (!input.includeInactive) {
      searchParams.set("active", "true");
    }

    // Example: Make authenticated FHIR request
    const response = await fetch(
      `${fhirBaseUrl}/Patient?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/fhir+json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`FHIR request failed: ${response.status} ${response.statusText}`);
    }

    const bundle = await response.json();

    // Process and return results
    return {
      patients: bundle.entry?.map((entry: any) => ({
        id: entry.resource.id,
        name: entry.resource.name?.[0],
        birthDate: entry.resource.birthDate,
        gender: entry.resource.gender,
        active: entry.resource.active
      })) || [],
      total: bundle.total || 0,
      practitionerContext: practitionerId // Include context in response
    };
  }
};
```

## Available FHIR Operations

With user context, you can perform various FHIR operations:

### 1. **Patient Operations**
```typescript
// Search patients
GET ${fhirBaseUrl}/Patient?name=smith&_active=true

// Get specific patient
GET ${fhirBaseUrl}/Patient/${patientId}

// Get patient's conditions
GET ${fhirBaseUrl}/Condition?patient=${patientId}
```

### 2. **Practitioner Operations**
```typescript
// Get current practitioner info
GET ${fhirBaseUrl}/Practitioner/${practitionerId}

// Search practitioners
GET ${fhirBaseUrl}/Practitioner?name=doe
```

### 3. **Observations**
```typescript
// Get patient observations
GET ${fhirBaseUrl}/Observation?patient=${patientId}&_sort=-date

// Get specific observation types
GET ${fhirBaseUrl}/Observation?patient=${patientId}&code=8867-4
```

### 4. **Medications**
```typescript
// Get patient medications
GET ${fhirBaseUrl}/MedicationRequest?patient=${patientId}&_intent=order
```

## Best Practices

### 1. **Always Check User Context**
```typescript
const userContext = input._userContext;
if (!userContext) {
  throw new Error("User context not available");
}
```

### 2. **Handle Optional Patient Context**
```typescript
const { patientId, practitionerId } = userContext;

if (patientId) {
  // Tool is operating in patient context
  return searchPatientSpecificData(patientId);
} else {
  // Tool is operating in practitioner-only context
  return searchPractitionerData(practitionerId);
}
```

### 3. **Use Authentication**
```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/fhir+json',
};
```

### 4. **Include Error Handling**
```typescript
try {
  const response = await fetch(fhirUrl, { headers });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please re-authenticate.");
    }
    throw new Error(`FHIR server error: ${response.status}`);
  }

  return await response.json();
} catch (error) {
  console.error(`FHIR tool ${toolName} error:`, error);
  throw new Error(`Failed to retrieve data: ${error.message}`);
}
```

### 5. **Log Context for Debugging**
```typescript
// console.log(`Executing ${toolName} for practitioner ${practitionerId}`, {
//   patientId,
//   fhirBaseUrl,
//   timestamp: new Date().toISOString()
// });
```

## Tool Categories

### FHIR Tools
These tools receive full user context including access tokens for authenticated requests:
- Patient search and retrieval
- Observation queries
- Medication management
- Condition tracking
- Practitioner lookups

### Non-FHIR Tools
These receive minimal context:
- General utilities
- Date/time functions
- External API calls (non-healthcare)

## Testing Tools

To test your MCP tools with user context:

1. **Start ChatEHR**: Run the development server
2. **Navigate to Chat**: Go to any chat page (the provider wraps chat routes)
3. **Ask Relevant Questions**: The AI will automatically use appropriate tools
4. **Check Logs**: Look for tool execution logs in the console

Example test queries:
- "Find all patients named Smith"
- "What are the latest observations for the current patient?"
- "List all conditions for patient [ID]"
- "Search for practitioners in cardiology"

## Security Considerations

1. **Token Management**: Access tokens are automatically injected and managed
2. **Context Isolation**: Each request gets fresh context with timestamps
3. **Error Sanitization**: FHIR errors are sanitized before user presentation
4. **Audit Trail**: All tool executions are logged with user context

## Migration from Context-less Tools

If you have existing MCP tools without user context:

1. Update tool to check for `input._userContext`
2. Replace hardcoded FHIR URLs with `fhirBaseUrl`
3. Add authentication headers using `accessToken`
4. Handle optional patient context appropriately
5. Test with different user contexts

This integration ensures that MCP tools have access to the necessary user context to perform authenticated, context-aware operations on the FHIR server.