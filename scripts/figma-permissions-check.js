#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FIGMA_API_KEY = process.env.FIGMA_API_KEY || 'YOUR_FIGMA_API_KEY_HERE';

// Test with different public Figma files to check API key permissions
const TEST_FILES = [
    { key: 'L6QcvvFA3Ww8fG6a6Wv6l9', name: 'Figma Community Sample', description: 'Public sample file' },
    { key: 'zR6G5xJvQ0Xq8YqL0wQ0mQ', name: 'Design System Example', description: 'Public design system' },
    { key: 'n1AqRbX6deIXncAMnQbiXW', name: 'Fataplus Design Systems', description: 'Target file (permission issue)' }
];

async function testFigmaPermissions() {
    console.log('🔍 Checking Figma API Key Permissions...');
    console.log(`API Key: ${FIGMA_API_KEY.substring(0, 15)}...\n`);

    const results = [];

    for (const file of TEST_FILES) {
        console.log(`📁 Testing: ${file.name} (${file.key})`);
        console.log(`Description: ${file.description}`);

        try {
            const response = await fetch(`https://api.figma.com/v1/files/${file.key}`, {
                headers: {
                    'X-Figma-Token': FIGMA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Access granted');
                console.log(`File Name: ${data.name}`);
                console.log(`Last Modified: ${data.lastModified}`);
                console.log(`Thumbnail URL: ${data.thumbnailUrl || 'N/A'}`);

                results.push({
                    file: file,
                    success: true,
                    data: data
                });
            } else {
                console.log(`❌ Access denied: ${response.status} ${response.statusText}`);
                results.push({
                    file: file,
                    success: false,
                    error: `${response.status} ${response.statusText}`
                });
            }
        } catch (error) {
            console.log(`❌ Network error: ${error.message}`);
            results.push({
                file: file,
                success: false,
                error: `Network error: ${error.message}`
            });
        }

        console.log('---\n');
    }

    // Save results
    const outputDir = path.join(process.cwd(), 'figma-analysis');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, 'figma-permissions-report.json'),
        JSON.stringify(results, null, 2)
    );

    console.log('📊 Summary Report:');
    console.log('=================');
    const accessibleFiles = results.filter(r => r.success);
    const inaccessibleFiles = results.filter(r => !r.success);

    console.log(`✅ Accessible Files: ${accessibleFiles.length}`);
    console.log(`❌ Inaccessible Files: ${inaccessibleFiles.length}`);

    if (accessibleFiles.length > 0) {
        console.log('\n🎉 Accessible Files:');
        accessibleFiles.forEach(r => {
            console.log(`- ${r.file.name}: ${r.data.name}`);
        });
    }

    if (inaccessibleFiles.length > 0) {
        console.log('\n🔧 Inaccessible Files:');
        inaccessibleFiles.forEach(r => {
            console.log(`- ${r.file.name}: ${r.error}`);
        });
    }

    return results;
}

async function testMcpWithAccessibleFile() {
    console.log('\n🔌 Testing MCP with accessible file...');

    // Find the first accessible file
    const results = await testFigmaPermissions();
    const accessibleFile = results.find(r => r.success);

    if (!accessibleFile) {
        console.log('❌ No accessible files found for MCP testing');
        return;
    }

    console.log(`\n🎯 Testing MCP with: ${accessibleFile.file.name}`);

    return new Promise((resolve) => {
        const mcpProcess = spawn('npx', ['figma-developer-mcp', '--figma-api-key', FIGMA_API_KEY, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let initialized = false;
        let timeout;

        const cleanup = () => {
            clearTimeout(timeout);
            mcpProcess.kill();
            resolve({ success: false, error: 'MCP test timeout' });
        };

        timeout = setTimeout(cleanup, 30000);

        mcpProcess.stdout.on('data', (data) => {
            const response = data.toString().trim();

            if (!initialized) {
                // Initialize response
                if (response.includes('"result"')) {
                    console.log('✅ MCP initialized successfully');
                    initialized = true;

                    // Send get_figma_data request
                    const getDataRequest = {
                        jsonrpc: "2.0",
                        id: 2,
                        method: "tools/call",
                        params: {
                            name: "get_figma_data",
                            arguments: {
                                file_key: accessibleFile.file.key,
                                node_id: "0:1" // Root node
                            }
                        }
                    };

                    mcpProcess.stdin.write(JSON.stringify(getDataRequest) + '\n');
                }
            } else {
                // get_figma_data response
                console.log('📨 MCP Data Response received');
                console.log(`Response length: ${response.length} characters`);

                try {
                    const parsed = JSON.parse(response);
                    if (parsed.result && parsed.result.content) {
                        console.log('✅ Successfully extracted Figma data via MCP');

                        // Save the data
                        const outputDir = path.join(process.cwd(), 'figma-analysis');
                        fs.writeFileSync(
                            path.join(outputDir, `mcp-${accessibleFile.file.key}-data.json`),
                            JSON.stringify(parsed.result, null, 2)
                        );

                        clearTimeout(timeout);
                        mcpProcess.kill();
                        resolve({
                            success: true,
                            file: accessibleFile,
                            data: parsed.result
                        });
                    } else {
                        throw new Error('Invalid response format');
                    }
                } catch (error) {
                    console.log('❌ Error parsing MCP response:', error.message);
                    cleanup();
                }
            }
        });

        mcpProcess.stderr.on('data', (data) => {
            console.log('❌ MCP Error:', data.toString());
        });

        mcpProcess.on('close', (code) => {
            if (!initialized || code !== 0) {
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
                    name: "Figma-Permissions-Test",
                    version: "1.0.0"
                }
            }
        };

        mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    });
}

async function main() {
    console.log('🚀 Starting Figma Permissions Test...\n');

    await testFigmaPermissions();
    const mcpResult = await testMcpWithAccessibleFile();

    console.log('\n📋 Final Recommendations:');
    console.log('========================');

    if (mcpResult && mcpResult.success) {
        console.log('✅ MCP server is working correctly');
        console.log(`✅ Can access file: ${mcpResult.file.name}`);
        console.log('🎯 The issue is with the specific Fataplus Design Systems file permissions');
        console.log('\n🔧 To fix the original issue:');
        console.log('1. Contact the owner of the Fataplus Design Systems file');
        console.log('2. Request access permissions for your API key');
        console.log('3. Verify the file key is correct');
        console.log('4. Check if the file is in a team with restricted access');
    } else {
        console.log('❌ MCP server issues detected');
        console.log('🔧 Troubleshooting steps:');
        console.log('1. Verify MCP server installation');
        console.log('2. Check API key validity');
        console.log('3. Test with different Figma files');
    }
}

main().catch(console.error);