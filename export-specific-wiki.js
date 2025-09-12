#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory with specific filtering
function getAllFiles(dirPath, arrayOfFiles = []) {
  // Skip certain directories
  const skipDirs = ['node_modules', '.git', 'out', '.next', 'dist', 'build', 'exported-wiki', 'wiki-export'];
  const dirName = path.basename(dirPath);
  
  if (skipDirs.includes(dirName)) {
    return arrayOfFiles;
  }

  let files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch (error) {
    // Skip directories we can't read
    return arrayOfFiles;
  }

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    let stat;
    
    try {
      stat = fs.statSync(filePath);
    } catch (error) {
      // Skip files we can't access
      return;
    }
    
    if (stat.isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      // Only include markdown files and specific documentation files
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.md' || ext === '.mdx') {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to export specific wiki documentation
function exportWiki(sourceDir, outputDir) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get all markdown files from the source directory
    const files = getAllFiles(sourceDir, []);
    
    console.log(`Found ${files.length} markdown files to export`);
    
    // Filter for project wiki related files
    const wikiFiles = files.filter(filePath => {
      const relativePath = path.relative(sourceDir, filePath).toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();
      
      // Include files that are likely part of the project documentation
      const wikiIndicators = [
        'readme.md', 'project_wiki.md', 'agents.md', 'spec', 'plan', 'tasks', 
        'roadmap', 'data-model', 'contract', 'docs', 'wiki', 'guide', 'manual',
        'instructions', 'howto', 'tutorial', 'design', 'architecture'
      ];
      
      // Include files in specific directories
      const wikiDirs = [
        'specs', 'docs', 'documentation', 'wiki', 'guides', 'manuals', 
        'templates', 'memory', 'templates', 'project'
      ];
      
      // Check if file name contains wiki indicators
      const hasWikiIndicator = wikiIndicators.some(indicator => 
        fileName.includes(indicator) || relativePath.includes(indicator));
      
      // Check if file is in a wiki directory
      const isInWikiDir = wikiDirs.some(dir => relativePath.includes(dir));
      
      // Always include top-level README and project documentation
      const isTopLevelDoc = relativePath === 'readme.md' || 
                           relativePath === 'project_wiki.md' ||
                           relativePath.includes('project-wiki') ||
                           relativePath.includes('documentation');
      
      return hasWikiIndicator || isInWikiDir || isTopLevelDoc;
    });
    
    console.log(`Filtered to ${wikiFiles.length} wiki/documentation files`);
    
    // Copy each wiki file to the output directory
    wikiFiles.forEach((file) => {
      const relativePath = path.relative(sourceDir, file);
      const outputPath = path.join(outputDir, relativePath);
      
      // Create directory structure if needed
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(file, outputPath);
      console.log(`Exported: ${relativePath}`);
    });
    
    // Create a summary file
    const summaryContent = `# Specific Project Wiki Export Summary

Exported ${wikiFiles.length} specific wiki/documentation files from the project.

## Exported Files:
${wikiFiles.map(file => `- ${path.relative(sourceDir, file)}`).join('\n')}

Export completed on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(outputDir, 'SPECIFIC_WIKI_EXPORT_SUMMARY.md'), summaryContent);
    
    console.log(`\nSpecific project wiki export completed successfully!`);
    console.log(`Exported to: ${outputDir}`);
    console.log(`Summary file created: SPECIFIC_WIKI_EXPORT_SUMMARY.md`);
    
  } catch (error) {
    console.error('Error exporting specific project wiki:', error.message);
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node export-specific-wiki.js <source_directory> <output_directory>');
    console.log('Example: node export-specific-wiki.js . ./specific-wiki-export');
    process.exit(1);
  }
  
  const sourceDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  console.log(`Exporting specific project wiki from: ${sourceDir}`);
  console.log(`Exporting to: ${outputDir}`);
  
  exportWiki(sourceDir, outputDir);
}

main();