# Figma MCP Tools Reference Guide

## Overview

This guide provides a comprehensive reference for the Figma MCP (Model Context Protocol) tools available in the FP-09 project. These tools enable programmatic access to Figma design files and assets.

## Available Tools

### 1. get_figma_data

**Description**: Retrieve comprehensive Figma file data including layout, content, visuals, and component information.

**Parameters**:
- `fileKey` (required): The key of the Figma file to fetch
  - Type: string
  - Description: Found in Figma URLs like `figma.com/design/<fileKey>/...`

- `nodeId` (optional): The ID of the node to fetch
  - Type: string
  - Description: Found as URL parameter `node-id=<nodeId>`
  - Recommendation: Always use if provided in the URL

- `depth` (optional): Controls how many levels deep to traverse the node tree
  - Type: number
  - Description: Higher values = more detailed data, larger responses
  - Default: 1-2 for design system analysis

**Example Usage**:
```javascript
const result = await client.testTool('get_figma_data', {
  fileKey: 'n1AqRbX6deIXncAMnQbiXW',
  nodeId: '2368-52',
  depth: 3
});
```

**Response Structure**:
```json
{
  "fileKey": "n1AqRbX6deIXncAMnQbiXW",
  "name": "Fataplus-Design-Systems",
  "lastModified": "2025-09-19T12:00:00Z",
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "children": [...]
  }
}
```

### 2. download_figma_images

**Description**: Download SVG and PNG images used in a Figma file based on the IDs of image or icon nodes.

**Parameters**:
- `fileKey` (required): The key of the Figma file containing the images
  - Type: string
  - Pattern: `^[a-zA-Z0-9]+$`

- `nodes` (required): Array of nodes to fetch as images
  - Type: array
  - Items: Object with properties:
    - `nodeId` (required): The ID of the Figma image node
      - Type: string
      - Pattern: `^I?\d+:\\d+(?:;\\d+:\\d+)*$`
      - Format: `1234:5678` or `I1234:5678`
    - `fileName` (required): Local filename with extension
      - Type: string
      - Pattern: `^[a-zA-Z0-9_.-]+$`
      - Extensions: `.png` or `.svg`
    - `imageRef` (optional): Required for image fill nodes
      - Type: string
    - `needsCropping` (optional): Whether image needs cropping
      - Type: boolean
    - `cropTransform` (optional): Transform matrix for cropping
      - Type: array of number arrays
    - `requiresImageDimensions` (optional): Need dimension info
      - Type: boolean
    - `filenameSuffix` (optional): Suffix for unique cropped images
      - Type: string

- `localPath` (required): Directory path for saving images
  - Type: string
  - Description: Absolute path to save directory

- `pngScale` (optional): Export scale for PNG images
  - Type: number
  - Minimum: 0
  - Default: 2
  - Description: Affects PNG files only, not SVG

**Example Usage**:
```javascript
const result = await client.testTool('download_figma_images', {
  fileKey: 'n1AqRbX6deIXncAMnQbiXW',
  nodes: [
    {
      nodeId: '1:2',
      fileName: 'logo.svg',
      needsCropping: false
    },
    {
      nodeId: '3:4',
      fileName: 'icon.png',
      needsCropping: true,
      cropTransform: [[1,0,0],[0,1,0]]
    }
  ],
  localPath: '/Users/fefe/FP-09/figma-assets',
  pngScale: 2
});
```

## Configuration

### Environment Variables

```bash
# Figma API Configuration
FIGMA_API_KEY=figd_your_api_key_here
FIGMA_MCP_MODE=stdio
FIGMA_MCP_DEBUG=true

# Output Configuration
FIGMA_IMAGE_OUTPUT_PATH=/Users/fefe/FP-09/figma-assets
FIGMA_PNG_EXPORT_SCALE=2
```

### File Locations

- **Config**: `/Users/fefe/FP-09/config/.env.figma-mcp`
- **Test Scripts**: `/Users/fefe/FP-09/scripts/figma-mcp-connection-test.js`
- **Analysis Scripts**: `/Users/fefe/FP-09/scripts/analyze-design-system.js`
- **Output Directory**: `/Users/fefe/FP-09/figma-analysis/`

## Usage Examples

### Basic Connection Test
```bash
node scripts/figma-mcp-connection-test.js --tools
```

### Design System Analysis
```bash
node scripts/analyze-design-system.js
```

### Custom Integration
```javascript
import { FigmaMCPClient } from './scripts/figma-mcp-connection-test.js';

const client = new FigmaMCPClient();

async function analyzeDesign() {
  await client.initialize();

  // Get design system data
  const designData = await client.testTool('get_figma_data', {
    fileKey: 'your-file-key',
    nodeId: 'your-node-id',
    depth: 3
  });

  // Process and analyze the data
  console.log('Design system analysis complete:', designData);
}
```

## Error Handling

### Common Errors

1. **403 Forbidden**
   - Cause: API key doesn't have access to the file
   - Solution: Verify file permissions and API key access

2. **Invalid File Key**
   - Cause: Incorrect or malformed file key
   - Solution: Extract file key from Figma URL carefully

3. **Node Not Found**
   - Cause: Invalid or non-existent node ID
   - Solution: Verify node ID exists in the file

4. **Rate Limiting**
   - Cause: Too many API requests
   - Solution: Implement request throttling

### Debug Mode

Enable debug logging by setting `FIGMA_MCP_DEBUG=true` in the configuration.

## Best Practices

### 1. File Access
- Ensure your API key has access to target files
- Verify files are shared with your account
- Use appropriate depth levels for file size

### 2. Performance
- Cache frequently accessed data
- Use reasonable depth values (1-3 typically sufficient)
- Batch multiple requests when possible

### 3. Security
- Keep API keys secure
- Use environment variables for configuration
- Implement proper error handling

### 4. Data Management
- Clean up downloaded assets regularly
- Implement proper data retention policies
- Respect Figma's terms of service

## Design System Analysis

### Extractable Information

**Colors**
- RGB and hex values
- Opacity levels
- Color naming conventions

**Typography**
- Font families and weights
- Type scale and sizing
- Line height and spacing

**Components**
- Atomic and composite components
- Variants and properties
- Usage patterns

**Layout**
- Grid systems
- Spacing tokens
- Breakpoints

**Assets**
- SVG and PNG images
- Icons and illustrations
- Media assets

## Integration with Development

### React Integration
```javascript
// Example React hook for Figma data
export function useFigmaDesignSystem(fileKey, nodeId) {
  const [designSystem, setDesignSystem] = useState(null);

  useEffect(() => {
    async function loadDesignSystem() {
      const client = new FigmaMCPClient();
      await client.initialize();

      const data = await client.testTool('get_figma_data', {
        fileKey,
        nodeId,
        depth: 2
      });

      setDesignSystem(analyzeDesignTokens(data));
    }

    loadDesignSystem();
  }, [fileKey, nodeId]);

  return designSystem;
}
```

### CSS Generation
```javascript
// Generate CSS variables from design tokens
function generateCSSVariables(designData) {
  const colors = designData.colors.map(color =>
    `--color-${color.name.toLowerCase()}: ${color.hex};`
  ).join('\n');

  const typography = designData.typography.map(type =>
    `--font-${type.name.toLowerCase()}: ${type.fontFamily};`
  ).join('\n');

  return `:root {\n${colors}\n${typography}\n}`;
}
```

## Troubleshooting

### Connection Issues
1. Verify API key is valid and not expired
2. Check internet connection
3. Ensure Figma file is accessible
4. Test with public files first

### Performance Issues
1. Reduce depth parameter values
2. Implement caching
3. Clean up old data files
4. Monitor request frequency

### Data Issues
1. Validate file structure
2. Check for missing permissions
3. Verify node IDs exist
4. Test with different files

## Support

For issues or questions:
1. Check this reference guide
2. Review the comprehensive connection guide
3. Run test scripts to diagnose problems
4. Check the Figma MCP server documentation

---

**Version**: 0.6.0
**Last Updated**: September 19, 2025
**Generated by**: FP-09 Project