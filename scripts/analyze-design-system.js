#!/usr/bin/env node

/**
 * Figma Design System Analysis Script
 * Extracts and analyzes the Fataplus Design System from Figma
 */

import { FigmaMCPClient } from './figma-mcp-connection-test.js';

async function analyzeDesignSystem() {
  console.log('🎨 Figma Design System Analysis');
  console.log('===============================');

  const client = new FigmaMCPClient();

  try {
    // Initialize connection
    await client.initialize();

    // Extract file key and node ID from the Figma URL
    const fileKey = 'n1AqRbX6deIXncAMnQbiXW';
    const nodeId = '2368-52';

    console.log(`📁 File Key: ${fileKey}`);
    console.log(`🎯 Node ID: ${nodeId}`);

    // Get Figma data with focus on design system node
    console.log('\n🔍 Retrieving design system data...');
    const figmaData = await client.testTool('get_figma_data', {
      fileKey: fileKey,
      nodeId: nodeId,
      depth: 3  // Go deeper to capture design system structure
    });

    if (!figmaData) {
      console.error('❌ Failed to retrieve Figma data');
      return;
    }

    console.log('✅ Design system data retrieved successfully');

    // Create output directory for analysis results
    const fs = await import('fs');
    const path = await import('path');

    const outputDir = '/Users/fefe/FP-09/figma-analysis';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save raw data
    const rawDataPath = path.join(outputDir, 'design-system-raw.json');
    fs.writeFileSync(rawDataPath, JSON.stringify(figmaData, null, 2));
    console.log(`💾 Raw data saved to: ${rawDataPath}`);

    // Analyze and extract design system information
    const analysis = analyzeFigmaDesignSystem(figmaData);

    // Save analysis results
    const analysisPath = path.join(outputDir, 'design-system-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    console.log(`💾 Analysis saved to: ${analysisPath}`);

    // Generate markdown report
    const reportPath = path.join(outputDir, 'design-system-report.md');
    const report = generateDesignSystemReport(analysis);
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Report generated: ${reportPath}`);

    console.log('\n🎉 Design system analysis completed!');

    // Print summary
    printDesignSystemSummary(analysis);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

function analyzeFigmaDesignSystem(figmaData) {
  const analysis = {
    file: {
      key: figmaData.fileKey,
      name: figmaData.name,
      lastModified: figmaData.lastModified
    },
    designSystem: {
      colors: [],
      typography: [],
      spacing: [],
      components: [],
      styles: [],
      structure: {}
    },
    assets: {
      images: [],
      icons: []
    }
  };

  // Extract design system information from the document
  if (figmaData.document) {
    analyzeNode(figmaData.document, analysis);
  }

  return analysis;
}

function analyzeNode(node, analysis, path = []) {
  const currentPath = [...path, node.name || 'unnamed'];

  // Extract design system information based on node properties
  if (node.name) {
    const name = node.name.toLowerCase();

    // Colors
    if (name.includes('color') || name.includes('palette') || name.includes('theme')) {
      extractColors(node, analysis);
    }

    // Typography
    if (name.includes('typography') || name.includes('font') || name.includes('text')) {
      extractTypography(node, analysis);
    }

    // Spacing
    if (name.includes('spacing') || name.includes('grid') || name.includes('layout')) {
      extractSpacing(node, analysis);
    }

    // Components
    if (node.componentPropertyDefinitions || node.componentProperties) {
      analysis.designSystem.components.push({
        name: node.name,
        id: node.id,
        type: node.type,
        path: currentPath.join(' / '),
        properties: node.componentPropertyDefinitions || {},
        children: node.children?.length || 0
      });
    }

    // Styles
    if (node.styles) {
      Object.entries(node.styles).forEach(([styleType, styleId]) => {
        analysis.designSystem.styles.push({
          nodeId: node.id,
          type: styleType,
          styleId: styleId,
          name: node.name,
          path: currentPath.join(' / ')
        });
      });
    }
  }

  // Build structure tree
  const structurePath = currentPath.join(' / ');
  if (!analysis.designSystem.structure[structurePath]) {
    analysis.designSystem.structure[structurePath] = {
      id: node.id,
      type: node.type,
      name: node.name,
      children: node.children?.length || 0
    };
  }

  // Recursively analyze children
  if (node.children) {
    node.children.forEach(child => {
      analyzeNode(child, analysis, currentPath);
    });
  }
}

function extractColors(node, analysis) {
  if (node.fills) {
    node.fills.forEach(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        analysis.designSystem.colors.push({
          name: node.name,
          r: Math.round(fill.color.r * 255),
          g: Math.round(fill.color.g * 255),
          b: Math.round(fill.color.b * 255),
          a: fill.color.a,
          hex: rgbToHex(fill.color),
          nodeId: node.id
        });
      }
    });
  }
}

function extractTypography(node, analysis) {
  if (node.style) {
    analysis.designSystem.typography.push({
      name: node.name,
      fontFamily: node.style.fontFamily,
      fontSize: node.style.fontSize,
      fontWeight: node.style.fontWeight,
      lineHeight: node.style.lineHeightPx,
      letterSpacing: node.style.letterSpacing,
      textAlignHorizontal: node.style.textAlignHorizontal,
      nodeId: node.id
    });
  }
}

function extractSpacing(node, analysis) {
  if (node.layoutMode || node.absoluteBoundingBox) {
    analysis.designSystem.spacing.push({
      name: node.name,
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      layoutMode: node.layoutMode,
      itemSpacing: node.itemSpacing,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      nodeId: node.id
    });
  }
}

function rgbToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function generateDesignSystemReport(analysis) {
  let report = `# Fataplus Design System Analysis Report\n\n`;
  report += `*Generated on: ${new Date().toISOString()}*\n`;
  report += `*File: ${analysis.file.name} (${analysis.file.key})*\n\n`;

  // Design System Structure
  report += `## Design System Structure\n\n`;
  Object.entries(analysis.designSystem.structure).forEach(([path, info]) => {
    report += `- **${path}** (${info.type})`;
    if (info.children > 0) {
      report += ` - ${info.children} children`;
    }
    report += `\n`;
  });

  // Colors
  if (analysis.designSystem.colors.length > 0) {
    report += `\n## Colors (${analysis.designSystem.colors.length})\n\n`;
    analysis.designSystem.colors.forEach(color => {
      report += `- **${color.name}**: ${color.hex} (RGB: ${color.r}, ${color.g}, ${color.b})\n`;
    });
  }

  // Typography
  if (analysis.designSystem.typography.length > 0) {
    report += `\n## Typography (${analysis.designSystem.typography.length})\n\n`;
    analysis.designSystem.typography.forEach(type => {
      report += `- **${type.name}**: ${type.fontFamily} ${type.fontWeight}px, ${type.fontSize}px\n`;
    });
  }

  // Spacing
  if (analysis.designSystem.spacing.length > 0) {
    report += `\n## Spacing & Layout (${analysis.designSystem.spacing.length})\n\n`;
    analysis.designSystem.spacing.forEach(spacing => {
      report += `- **${spacing.name}**: ${spacing.width}x${spacing.height}`;
      if (spacing.layoutMode) {
        report += ` (${spacing.layoutMode})`;
      }
      report += `\n`;
    });
  }

  // Components
  if (analysis.designSystem.components.length > 0) {
    report += `\n## Components (${analysis.designSystem.components.length})\n\n`;
    analysis.designSystem.components.forEach(component => {
      report += `- **${component.name}**: ${component.type}`;
      if (Object.keys(component.properties).length > 0) {
        report += ` - Properties: ${Object.keys(component.properties).join(', ')}`;
      }
      report += `\n`;
    });
  }

  // Styles
  if (analysis.designSystem.styles.length > 0) {
    report += `\n## Styles (${analysis.designSystem.styles.length})\n\n`;
    analysis.designSystem.styles.forEach(style => {
      report += `- **${style.name}**: ${style.type} (${style.styleId})\n`;
    });
  }

  return report;
}

function printDesignSystemSummary(analysis) {
  console.log('\n📊 Design System Summary:');
  console.log(`  Colors: ${analysis.designSystem.colors.length}`);
  console.log(`  Typography styles: ${analysis.designSystem.typography.length}`);
  console.log(`  Spacing tokens: ${analysis.designSystem.spacing.length}`);
  console.log(`  Components: ${analysis.designSystem.components.length}`);
  console.log(`  Styles: ${analysis.designSystem.styles.length}`);
  console.log(`  Structure nodes: ${Object.keys(analysis.designSystem.structure).length}`);

  if (analysis.designSystem.colors.length > 0) {
    console.log('\n🎨 Sample Colors:');
    analysis.designSystem.colors.slice(0, 5).forEach(color => {
      console.log(`  ${color.name}: ${color.hex}`);
    });
  }

  if (analysis.designSystem.typography.length > 0) {
    console.log('\n📝 Sample Typography:');
    analysis.designSystem.typography.slice(0, 3).forEach(type => {
      console.log(`  ${type.name}: ${type.fontFamily} ${type.fontSize}px`);
    });
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeDesignSystem();
}