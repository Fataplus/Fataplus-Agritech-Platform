# Figma MCP Server Connection Guide

This guide provides comprehensive information about connecting to and using the Figma MCP server in the FP-09 project.

## Overview

The Figma MCP server provides tools for:
- **get_figma_data**: Retrieve comprehensive Figma file data including layout, content, visuals, and component information
- **download_figma_images**: Download SVG and PNG images from Figma files

## Prerequisites

- Node.js 18+ installed
- Figma API key (starts with `figd_`)
- Access to the Figma files you want to interact with

## Configuration

### Environment Configuration

The Figma MCP server is configured through `/Users/fefe/FP-09/config/.env.figma-mcp`:

```bash
# FIGMA MCP SERVER SETTINGS
FIGMA_MCP_URL=http://127.0.0.1:3845/mcp
FIGMA_MCP_PORT=3845
FIGMA_MCP_HOST=127.0.0.1

# FIGMA API CREDENTIALS
FIGMA_API_KEY=figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2

# CONNECTION MODE
FIGMA_MCP_MODE=stdio

# LOCAL DEVELOPMENT SETTINGS
FIGMA_MCP_DEBUG=true
FIGMA_MCP_LOG_LEVEL=debug

# OUTPUT CONFIGURATION
FIGMA_IMAGE_OUTPUT_PATH=/Users/fefe/FP-09/figma-assets
FIGMA_PNG_EXPORT_SCALE=2
```

## Connection Testing

### Quick Test

```bash
# Run comprehensive test
./scripts/test-figma-mcp.sh

# Test initialization only
node scripts/figma-mcp-connection-test.js --init

# List available tools
node scripts/figma-mcp-connection-test.js --tools

# Get help
node scripts/figma-mcp-connection-test.js --help
```

### Manual Connection Test

```bash
# Test stdio connection directly
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}},"id":1}' | npx figma-developer-mcp --figma-api-key=figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2 --stdio
```

## Available Tools

### 1. get_figma_data

**Description**: Get comprehensive Figma file data including layout, content, visuals, and component information

**Parameters**:
- `fileKey` (required): The key of the Figma file to fetch
- `nodeId` (optional): The ID of the node to fetch
- `depth` (optional): Controls how many levels deep to traverse the node tree

**Example**:
```javascript
const result = await client.testTool('get_figma_data', {
  fileKey: 'your-file-key-here',
  nodeId: '1:2',
  depth: 2
});
```

### 2. download_figma_images

**Description**: Download SVG and PNG images used in a Figma file based on the IDs of image or icon nodes

**Parameters**:
- `fileKey` (required): The key of the Figma file containing the images
- `nodes` (required): Array of nodes to fetch as images
- `localPath` (required): Local directory path for saving images
- `pngScale` (optional): Export scale for PNG images (default: 2)

**Example**:
```javascript
const result = await client.testTool('download_figma_images', {
  fileKey: 'your-file-key-here',
  nodes: [
    {
      nodeId: '1:2',
      fileName: 'example.png',
      needsCropping: false
    }
  ],
  localPath: '/Users/fefe/FP-09/figma-assets',
  pngScale: 2
});
```

## Implementation Examples

### Basic Usage

```javascript
import { FigmaMCPClient } from '../scripts/figma-mcp-connection-test.js';

const client = new FigmaMCPClient();

async function main() {
  try {
    // Initialize connection
    await client.initialize();

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Get Figma data
    const figmaData = await client.testTool('get_figma_data', {
      fileKey: 'your-file-key'
    });
    console.log('Figma data:', figmaData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### React Hook Integration

```javascript
// hooks/useFigmaMCP.js
import { useState, useEffect } from 'react';

export function useFigmaMCP() {
  const [isConnected, setIsConnected] = useState(false);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/figma-mcp/connect', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setTools(data.tools);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFigmaData = async (fileKey, nodeId, depth) => {
    try {
      const response = await fetch('/api/figma-mcp/get-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, nodeId, depth })
      });
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isConnected,
    tools,
    loading,
    error,
    connect,
    getFigmaData
  };
}
```

## Server Status

The Figma MCP server is currently:
- ✅ **Running** with 12 active processes
- ✅ **Version**: 0.6.0
- ✅ **Protocol**: 2024-11-05
- ✅ **Mode**: stdio
- ✅ **API Key**: Configured and working

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure Figma API key is valid
   - Check if Node.js is installed (version 18+)
   - Verify the `figma-developer-mcp` package is available

2. **Tool Call Failed**
   - Verify file key is correct
   - Ensure you have access to the Figma file
   - Check node ID format if specified

3. **Permission Errors**
   - Verify Figma API key permissions
   - Ensure the Figma file is shared with your account

### Debug Mode

Enable debug logging by setting `FIGMA_MCP_DEBUG=true` in the configuration file.

### Log Files

Check the following locations for logs:
- Console output when running test scripts
- Node.js error logs
- MCP server process logs

## Integration with Existing MCP Infrastructure

The project already has a comprehensive MCP infrastructure:

### Existing MCP Components

1. **Fataplus MCP Server** (`/Users/fefe/FP-09/deployment/mcp/mcp-server/`)
   - Agricultural data and analytics tools
   - Weather, market, and livestock information
   - Farm management capabilities

2. **MCP Client** (`/Users/fefe/FP-09/agribot-space/src/services/mcp.ts`)
   - Backend integration for agricultural context
   - User context management
   - Cross-context analysis

3. **Configuration** (`/Users/fefe/FP-09/config/.env.mcp`)
   - Docker and Cloudflare deployment settings
   - Database and cache configuration
   - Security and monitoring settings

### Adding Figma MCP to Existing Infrastructure

To integrate the Figma MCP server with the existing MCP client:

```typescript
// Extend the existing MCP client
class EnhancedMCPClient extends MCPClient {
  private figmaClient: FigmaMCPClient;

  constructor() {
    super();
    this.figmaClient = new FigmaMCPClient();
  }

  async getFigmaDesignContext(fileKey: string, nodeId?: string) {
    await this.figmaClient.initialize();
    return await this.figmaClient.testTool('get_figma_data', {
      fileKey,
      nodeId
    });
  }

  async downloadFigmaAssets(fileKey: string, nodes: any[], localPath: string) {
    await this.figmaClient.initialize();
    return await this.figmaClient.testTool('download_figma_images', {
      fileKey,
      nodes,
      localPath
    });
  }
}
```

## Security Considerations

1. **API Key Management**
   - Store Figma API keys securely
   - Rotate keys regularly
   - Use environment variables for configuration

2. **File Access**
   - Ensure proper permissions for Figma files
   - Validate file keys before processing
   - Implement rate limiting

3. **Data Privacy**
   - Don't store sensitive Figma data
   - Implement proper data retention policies
   - Comply with Figma's terms of service

## Performance Optimization

1. **Caching**
   - Cache frequently accessed Figma data
   - Implement intelligent cache invalidation
   - Use CDN for downloaded images

2. **Request Optimization**
   - Batch multiple requests when possible
   - Use appropriate depth levels for node traversal
   - Implement request timeouts

3. **Resource Management**
   - Clean up downloaded files regularly
   - Monitor memory usage
   - Implement connection pooling

## Support

For issues or questions:
1. Check the troubleshooting section
2. Run the test scripts to diagnose problems
3. Review the existing MCP infrastructure documentation
4. Check the Figma MCP server documentation

## Files and Directories

- **Configuration**: `/Users/fefe/FP-09/config/.env.figma-mcp`
- **Test Scripts**: `/Users/fefe/FP-09/scripts/figma-mcp-connection-test.js`
- **Shell Script**: `/Users/fefe/FP-09/scripts/test-figma-mcp.sh`
- **Documentation**: This guide (`/Users/fefe/FP-09/docs/FIGMA_MCP_CONNECTION_GUIDE.md`)
- **Assets Directory**: `/Users/fefe/FP-09/figma-assets/` (auto-created)

---

**Last Updated**: September 19, 2025
**Status**: ✅ Connection established and tested