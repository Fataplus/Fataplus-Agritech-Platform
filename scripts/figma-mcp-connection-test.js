#!/usr/bin/env node

/**
 * Figma MCP Server Connection Test Script
 * Tests connection to the Figma MCP server and demonstrates available tools
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load configuration
const configPath = join(process.cwd(), 'config', '.env.figma-mcp');
let config = {};

try {
  const configContent = readFileSync(configPath, 'utf8');
  configContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('Warning: Could not load .env.figma-mcp file, using defaults');
}

class FigmaMCPClient {
  constructor() {
    this.figmaApiKey = config.FIGMA_API_KEY || 'YOUR_FIGMA_API_KEY_HERE';
    this.mode = config.FIGMA_MCP_MODE || 'stdio';
    this.debug = config.FIGMA_MCP_DEBUG === 'true';
    this.requestId = 1;
    this.initialized = false;
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id: this.requestId++
      };

      if (this.debug) {
        console.log('📤 Sending request:', JSON.stringify(request, null, 2));
      }

      const args = ['figma-developer-mcp', `--figma-api-key=${this.figmaApiKey}`, '--stdio'];
      const child = spawn('npx', args);

      let responseData = '';
      let errorData = '';

      child.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      child.on('close', (code) => {
        if (errorData) {
          console.error('❌ MCP Server Error:', errorData);
          reject(new Error(errorData));
          return;
        }

        try {
          const response = JSON.parse(responseData.trim());
          if (this.debug) {
            console.log('📥 Received response:', JSON.stringify(response, null, 2));
          }
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn MCP server: ${error.message}`));
      });

      // Send the request
      child.stdin.write(JSON.stringify(request) + '\n');

      // Close stdin after sending the request
      child.stdin.end();
    });
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🔧 Initializing connection to Figma MCP Server...');

    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'Figma MCP Test Client',
        version: '1.0.0'
      }
    });

    if (response.result) {
      this.initialized = true;
      console.log('✅ Successfully connected to Figma MCP Server');
      console.log(`📋 Server Info: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
      console.log(`🔗 Protocol Version: ${response.result.protocolVersion}`);
    } else {
      throw new Error(`Initialization failed: ${response.error?.message || 'Unknown error'}`);
    }
  }

  async listTools() {
    console.log('🛠️  Fetching available tools...');

    const response = await this.sendRequest('tools/list');

    if (response.result?.tools) {
      console.log('✅ Available tools:');
      response.result.tools.forEach((tool, index) => {
        console.log(`\n${index + 1}. ${tool.name}`);
        console.log(`   Description: ${tool.description}`);
        if (tool.inputSchema?.required) {
          console.log(`   Required parameters: ${tool.inputSchema.required.join(', ')}`);
        }
      });
      return response.result.tools;
    } else {
      throw new Error(`Failed to list tools: ${response.error?.message || 'Unknown error'}`);
    }
  }

  async testTool(toolName, params = {}) {
    console.log(`🧪 Testing tool: ${toolName}`);

    const response = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: params
    });

    if (response.result) {
      console.log('✅ Tool call successful');
      return response.result;
    } else {
      console.log('❌ Tool call failed:', response.error?.message || 'Unknown error');
      return null;
    }
  }

  async runComprehensiveTest() {
    try {
      await this.initialize();
      const tools = await this.listTools();

      // Test with a sample Figma file if available
      const sampleFileKey = config.FIGMA_DEFAULT_FILE_KEY;
      if (sampleFileKey && tools.find(t => t.name === 'get_figma_data')) {
        console.log('\n🎨 Testing Figma data retrieval...');
        await this.testTool('get_figma_data', {
          fileKey: sampleFileKey,
          depth: 2
        });
      } else {
        console.log('\n💡 To test Figma data retrieval, set FIGMA_DEFAULT_FILE_KEY in .env.figma-mcp');
      }

      console.log('\n🎉 Connection test completed successfully!');

    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Figma MCP Server Connection Test');
  console.log('=====================================');

  const client = new FigmaMCPClient();

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node figma-mcp-connection-test.js [OPTIONS]

Options:
  --help, -h          Show this help message
  --tools, -t         Only list available tools
  --test <tool>       Test a specific tool
  --init              Only test initialization
  --debug             Enable debug logging

Examples:
  node figma-mcp-connection-test.js              # Run comprehensive test
  node figma-mcp-connection-test.js --tools      # List tools only
  node figma-mcp-connection-test.js --init       # Test initialization only
`);
    process.exit(0);
  }

  if (args.includes('--debug')) {
    client.debug = true;
  }

  try {
    if (args.includes('--tools') || args.includes('-t')) {
      await client.initialize();
      await client.listTools();
    } else if (args.includes('--init')) {
      await client.initialize();
      console.log('✅ Initialization test completed');
    } else if (args.includes('--test')) {
      const toolName = args[args.indexOf('--test') + 1];
      if (!toolName) {
        console.error('❌ Please specify a tool name to test');
        process.exit(1);
      }
      await client.initialize();
      await client.testTool(toolName);
    } else {
      await client.runComprehensiveTest();
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { FigmaMCPClient };