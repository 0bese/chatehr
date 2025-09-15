import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { convertMCPToolToAiTool } from "@/lib/utils";
import { mcpMonitor, MCPError, MCPErrorCodes, withRetry, checkMCPHealth } from "./mcpMonitoring";
import { SessionUser } from "@/lib/auth";

// MCP Client Configuration
const MCP_CONFIG = {
  throwOnLoadError: true,
  prefixToolNameWithServerName: false,
  additionalToolNamePrefix: "",
  useStandardContentBlocks: true,

  mcpServers: {
    "fhir-mcp": {
      url: "https://fhir-mcp.onrender.com/mcp",
      automaticSSEFallback: false,
    },
  },
};

// Singleton MCP client instance
let mcpClientInstance: MultiServerMCPClient | null = null;
let toolCache: Record<string, any> | null = null;
let lastToolFetch: number = 0;
const TOOL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Gets or creates the MCP client instance
 */
export async function getMCPClient(): Promise<MultiServerMCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MultiServerMCPClient(MCP_CONFIG);
  }
  return mcpClientInstance;
}

/**
 * Fetches tools from MCP server with caching, retry logic, and monitoring
 */
export async function getMCPTools(): Promise<Record<string, any>> {
  return getMCPToolsWithUserContext(null);
}

/**
 * Fetches tools from MCP server (kept for backward compatibility, but without user context)
 */
export async function getMCPToolsWithUserContext(user: SessionUser | null): Promise<Record<string, any>> {
  const now = Date.now();

  // Return cached tools if still valid
  if (toolCache && (now - lastToolFetch) < TOOL_CACHE_TTL) {
    return toolCache;
  }

  try {
    // Use retry logic with monitoring
    const aiTools = await withRetry(async () => {
      const client = await getMCPClient();
      const mcpTools = await client.getTools();

      if (!mcpTools || mcpTools.length === 0) {
        throw new MCPError(
          "No tools available from MCP server",
          MCPErrorCodes.TOOL_FETCH_FAILED
        );
      }

      // Convert MCP tools to AI SDK format (without user context injection)
      const convertedTools = Object.assign({}, ...mcpTools.map(convertMCPToolToAiTool));

      return convertedTools;
    });

    // Update cache
    toolCache = aiTools;
    lastToolFetch = now;

    return aiTools;
  } catch (error) {
    console.error("Failed to fetch MCP tools:", error);

    // Record failure in monitoring
    mcpMonitor.recordFailure(
      error instanceof Error ? error.message : "Unknown error fetching tools"
    );

    // Return empty object on error, allowing graceful degradation
    return {};
  }
}

/**
 * Clears the tool cache (useful for development/debugging)
 */
export function clearToolCache(): void {
  toolCache = null;
  lastToolFetch = 0;
}

/**
 * Get MCP client status with health check
 */
export async function getMCPStatus(): Promise<{
  connected: boolean;
  toolCount: number;
  lastFetch: number;
  health?: 'healthy' | 'degraded' | 'unhealthy';
}> {
  try {
    // Check server health
    const healthStatus = await checkMCPHealth(MCP_CONFIG.mcpServers["fhir-mcp"].url);

    const client = await getMCPClient();
    const tools = await getMCPTools();

    const status = {
      connected: healthStatus.connected,
      toolCount: Object.keys(tools).length,
      lastFetch: lastToolFetch,
      health: healthStatus.connected ? 'healthy' : 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
    };

    // Record health status
    mcpMonitor.recordHealth({
      ...healthStatus,
      toolCount: status.toolCount,
    });

    return status;
  } catch (error) {
    const status = {
      connected: false,
      toolCount: 0,
      lastFetch: lastToolFetch,
      health: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
    };

    mcpMonitor.recordHealth({
      connected: false,
      toolCount: 0,
      lastFetch: lastToolFetch,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return status;
  }
}