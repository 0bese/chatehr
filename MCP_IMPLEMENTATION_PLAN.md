# MCP Server Integration Implementation Plan

## Overview
This plan outlines the implementation of remote MCP (Model Context Protocol) server integration for the ChatEHR project, connecting to `https://fhir-mcp.onrender.com/mcp` to provide FHIR-related tools to the AI assistant.

## Architecture Components

### 1. MCP Client Management (`/src/lib/mcp/mcpClient.ts`)
- **Singleton Pattern**: Single MCP client instance for efficient resource usage
- **Tool Caching**: 5-minute TTL cache to reduce server calls
- **Automatic Retry**: Exponential backoff retry logic for failed requests
- **Graceful Degradation**: Falls back to base tools if MCP server is unavailable

### 2. Monitoring & Error Handling (`/src/lib/mcp/mcpMonitoring.ts`)
- **Health Monitoring**: Track connection status, response times, and error rates
- **Metrics Collection**: Success/failure rates, average response times
- **Error Classification**: Specific error codes for different failure types
- **Retry Logic**: Configurable retry attempts with exponential backoff

### 3. Chat API Integration (`/src/app/api/chat/route.ts`)
- **Tool Combination**: Merge MCP tools with base tools (getInformation, etc.)
- **Dynamic Loading**: Load tools on-demand for each chat request
- **Error Resilience**: Continue operating even if MCP server fails
- **Performance Logging**: Track tool availability and usage

## Implementation Steps

### Phase 1: Core Infrastructure ✅
- [x] Create MCP client singleton with configuration
- [x] Implement tool fetching with caching
- [x] Add retry logic and error handling
- [x] Create monitoring system for health tracking

### Phase 2: Integration ✅
- [x] Update chat route to fetch MCP tools
- [x] Combine MCP tools with base tools
- [x] Add comprehensive error handling
- [x] Implement health monitoring

### Phase 3: Testing & Monitoring
- [ ] Test MCP server connectivity
- [ ] Verify tool loading and conversion
- [ ] Monitor performance metrics
- [ ] Set up alerting for failures

### Phase 4: Production Optimization
- [ ] Optimize tool caching strategy
- [ ] Implement circuit breaker pattern
- [ ] Add detailed logging and analytics
- [ ] Create admin dashboard for monitoring

## Key Features

### 1. **Automatic Tool Discovery**
```typescript
const mcpTools = await getMCPTools();
// Dynamically loads and converts MCP tools to AI SDK format
```

### 2. **Health Monitoring**
```typescript
const status = await getMCPStatus();
// Returns: { connected: boolean, toolCount: number, health: 'healthy' | 'degraded' | 'unhealthy' }
```

### 3. **Graceful Degradation**
- If MCP server fails, system continues with base tools only
- No user-facing errors for MCP connectivity issues
- Automatic retry with exponential backoff

### 4. **Performance Optimization**
- Tool caching (5-minute TTL)
- Connection pooling via singleton client
- Lazy loading of tools only when needed

## Error Handling Strategy

### Connection Failures
- Retry up to 3 times with exponential backoff
- Fallback to base tools only
- Log errors for monitoring

### Tool Fetch Failures
- Return empty tool set instead of throwing
- Continue chat functionality with available tools
- Record failure metrics for alerting

### Tool Execution Failures
- Individual tool failures don't break entire chat
- Error messages are user-friendly
- Failed tools are logged for debugging

## Monitoring & Observability

### Metrics Tracked
- Total MCP requests
- Success/failure rates
- Average response times
- Tool availability counts
- Connection health status

### Health Checks
- Server connectivity monitoring
- Tool availability verification
- Response time tracking
- Error rate calculation

### Dashboard Data
```typescript
const dashboard = getMCPDashboard();
// Returns comprehensive monitoring data including:
// - Success rate percentage
// - Recent health history
// - Performance metrics
// - Uptime calculation
```

## Configuration

### MCP Server Settings
```typescript
const MCP_CONFIG = {
  mcpServers: {
    "fhir-mcp": {
      url: "https://fhir-mcp.onrender.com/mcp",
      automaticSSEFallback: false,
    },
  },
};
```

### Retry Configuration
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};
```

### Cache Configuration
```typescript
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // tools
};
```

## Security Considerations

### 1. **Network Security**
- HTTPS-only connections to MCP server
- Timeout configurations to prevent hanging requests
- Proper error sanitization

### 2. **Tool Validation**
- JSON Schema to Zod conversion validation
- Input sanitization before tool execution
- Error message filtering

### 3. **Resource Limits**
- Maximum retry attempts
- Request timeouts
- Tool execution limits

## Testing Plan

### Unit Tests
- MCP client initialization
- Tool conversion logic
- Error handling scenarios
- Retry mechanism

### Integration Tests
- Full chat flow with MCP tools
- Error recovery scenarios
- Performance benchmarks
- Health check endpoints

### Load Testing
- Concurrent chat requests
- Tool caching performance
- Error rate under load

## Deployment Checklist

- [ ] Verify MCP server accessibility
- [ ] Test tool loading in production environment
- [ ] Monitor initial performance metrics
- [ ] Set up alerting for failures
- [ ] Document troubleshooting procedures
- [ ] Create runbooks for common issues

## Future Enhancements

### 1. **Multiple MCP Servers**
Support for connecting to multiple MCP servers simultaneously

### 2. **Dynamic Tool Discovery**
Real-time tool discovery without server restart

### 3. **Advanced Tool Filtering**
Selective tool loading based on chat context or user permissions

### 4. **Tool Usage Analytics**
Detailed analytics on which tools are used most frequently

### 5. **Circuit Breaker Pattern**
Automatic MCP server disconnection during extended outages

## Files Created/Modified

### New Files
- `/src/lib/mcp/mcpClient.ts` - Core MCP client functionality
- `/src/lib/mcp/mcpMonitoring.ts` - Monitoring and error handling
- `/src/app/api/chat/mcp-enhanced.ts` - Enhanced chat API (backup)

### Modified Files
- `/src/app/api/chat/route.ts` - Integrated MCP tools
- `/src/lib/utils.ts` - Enhanced tool conversion utilities

This implementation provides a robust, production-ready MCP server integration that enhances the AI assistant's capabilities while maintaining system reliability and performance. The architecture is designed to gracefully handle failures and provide comprehensive monitoring for operational visibility.