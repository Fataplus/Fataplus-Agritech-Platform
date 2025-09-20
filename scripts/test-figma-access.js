#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FIGMA_API_KEY = 'figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2';
const FIGMA_FILE_KEY = 'n1AqRbX6deIXncAMnQbiXW';
const FIGMA_NODE_ID = '2368-52';

async function testFigmaDirectAccess() {
    console.log('🔍 Testing Direct Figma API Access...');
    console.log(`File Key: ${FIGMA_FILE_KEY}`);
    console.log(`Node ID: ${FIGMA_NODE_ID}`);
    console.log(`API Key: ${FIGMA_API_KEY.substring(0, 15)}...`);

    // Test 1: Check if we can access the file via Figma REST API
    const figmaApiUrl = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`;
    const figmaNodeUrl = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${FIGMA_NODE_ID}`;

    console.log('\n📡 Testing Figma REST API...');

    try {
        const response = await fetch(figmaApiUrl, {
            headers: {
                'X-Figma-Token': FIGMA_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ File accessible via REST API');
            console.log(`File Name: ${data.name}`);
            console.log(`Last Modified: ${data.lastModified}`);

            // Test node access
            const nodeResponse = await fetch(figmaNodeUrl, {
                headers: {
                    'X-Figma-Token': FIGMA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (nodeResponse.ok) {
                const nodeData = await nodeResponse.json();
                console.log('✅ Node accessible via REST API');
                console.log(`Node found: ${Object.keys(nodeData.nodes).length}`);

                // Save the data
                const outputDir = path.join(process.cwd(), 'figma-analysis');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                fs.writeFileSync(
                    path.join(outputDir, 'figma-file-data.json'),
                    JSON.stringify(data, null, 2)
                );

                fs.writeFileSync(
                    path.join(outputDir, 'figma-node-data.json'),
                    JSON.stringify(nodeData, null, 2)
                );

                console.log(`💾 Data saved to ${outputDir}/`);

                return {
                    success: true,
                    fileData: data,
                    nodeData: nodeData
                };
            } else {
                console.log('❌ Node access failed:', nodeResponse.status, nodeResponse.statusText);
                return { success: false, error: 'Node access failed' };
            }
        } else {
            console.log('❌ File access failed:', response.status, response.statusText);
            return { success: false, error: 'File access failed' };
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
        return { success: false, error: 'Network error' };
    }
}

async function testMcpServerAccess() {
    console.log('\n🔌 Testing MCP Server Access...');

    return new Promise((resolve) => {
        const mcpProcess = spawn('npx', ['figma-developer-mcp', '--figma-api-key', FIGMA_API_KEY, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let dataReceived = false;
        let timeout;

        const cleanup = () => {
            clearTimeout(timeout);
            mcpProcess.kill();
            resolve({ success: false, error: 'No response from MCP server' });
        };

        timeout = setTimeout(cleanup, 10000);

        mcpProcess.stdout.on('data', (data) => {
            const response = data.toString();
            console.log('📨 MCP Response:', response.substring(0, 200) + '...');
            dataReceived = true;
            clearTimeout(timeout);
            mcpProcess.kill();
            resolve({ success: true, response: response });
        });

        mcpProcess.stderr.on('data', (data) => {
            console.log('❌ MCP Error:', data.toString());
        });

        mcpProcess.on('close', (code) => {
            if (!dataReceived) {
                cleanup();
            }
        });

        // Send initialization request
        const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: {
                    name: "Figma-Test-Client",
                    version: "1.0.0"
                }
            }
        };

        mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    });
}

async function main() {
    console.log('🚀 Starting Figma Access Test Suite...\n');

    const directResult = await testFigmaDirectAccess();
    const mcpResult = await testMcpServerAccess();

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Direct API Access: ${directResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`MCP Server: ${mcpResult.success ? '✅ Success' : '❌ Failed'}`);

    if (directResult.success) {
        console.log('\n🎉 Direct API access working!');
        console.log('You can now extract design system data from Figma.');
    } else {
        console.log('\n🔧 Troubleshooting needed:');
        console.log('1. Check API key permissions');
        console.log('2. Verify file accessibility');
        console.log('3. Contact file owner for access');
    }

    process.exit(directResult.success ? 0 : 1);
}

main().catch(console.error);