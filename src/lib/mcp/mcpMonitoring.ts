/**
 * MCP Server Monitoring and Error Handling
 */

export interface MCPHealthStatus {
  connected: boolean;
  toolCount: number;
  lastFetch: number;
  error?: string;
  responseTime?: number;
}

export interface MCPMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError?: string;
  lastErrorTime?: number;
}

class MCPMonitor {
  private metrics: MCPMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };

  private healthHistory: MCPHealthStatus[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Record a successful MCP request
   */
  recordSuccess(responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests;
  }

  /**
   * Record a failed MCP request
   */
  recordFailure(error: string): void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.lastError = error;
    this.metrics.lastErrorTime = Date.now();
  }

  /**
   * Record health status
   */
  recordHealth(status: MCPHealthStatus): void {
    this.healthHistory.push(status);

    // Keep history size manageable
    if (this.healthHistory.length > this.MAX_HISTORY_SIZE) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MCPMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent health history
   */
  getHealthHistory(limit: number = 10): MCPHealthStatus[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 100;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  /**
   * Check if MCP server is healthy (based on recent history)
   */
  isHealthy(threshold: number = 0.8): boolean {
    if (this.healthHistory.length === 0) return true;

    const recent = this.healthHistory.slice(-10);
    const healthyCount = recent.filter(h => h.connected).length;
    return healthyCount / recent.length >= threshold;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
    this.healthHistory = [];
  }
}

// Export singleton instance
export const mcpMonitor = new MCPMonitor();

/**
 * Enhanced error handling for MCP operations
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export const MCPErrorCodes = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TOOL_FETCH_FAILED: 'TOOL_FETCH_FAILED',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
} as const;

/**
 * Retry utility for MCP operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const responseTime = Date.now() - startTime;

      mcpMonitor.recordSuccess(responseTime);
      return result;
    } catch (error) {
      lastError = error as Error;
      mcpMonitor.recordFailure(lastError.message);

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }

  throw lastError!;
}

/**
 * Health check with monitoring
 */
export async function checkMCPHealth(url: string): Promise<MCPHealthStatus> {
  const startTime = Date.now();

  try {
    // Simple connectivity check - you might want to implement a proper health endpoint
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 5000,
    } as any);

    const responseTime = Date.now() - startTime;

    const status: MCPHealthStatus = {
      connected: response.ok,
      toolCount: 0, // Will be populated by actual tool fetch
      lastFetch: Date.now(),
      responseTime,
    };

    mcpMonitor.recordHealth(status);
    return status;
  } catch (error) {
    const status: MCPHealthStatus = {
      connected: false,
      toolCount: 0,
      lastFetch: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    mcpMonitor.recordHealth(status);
    return status;
  }
}

/**
 * Get monitoring dashboard data
 */
export function getMCPDashboard() {
  const metrics = mcpMonitor.getMetrics();
  const recentHealth = mcpMonitor.getHealthHistory(20);
  const successRate = mcpMonitor.getSuccessRate();
  const isHealthy = mcpMonitor.isHealthy();

  return {
    metrics,
    recentHealth,
    successRate,
    isHealthy,
    uptime: calculateUptime(recentHealth),
  };
}

/**
 * Calculate uptime percentage from health history
 */
function calculateUptime(healthHistory: MCPHealthStatus[]): number {
  if (healthHistory.length === 0) return 100;

  const connectedCount = healthHistory.filter(h => h.connected).length;
  return (connectedCount / healthHistory.length) * 100;
}