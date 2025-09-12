#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory with filtering
function getAllFiles(dirPath, arrayOfFiles = [], filterFn) {
  // Skip certain directories
  const skipDirs = ['node_modules', '.git', 'out', '.next', 'dist', 'build'];
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
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles, filterFn);
    } else {
      // Apply filter function if provided
      if (!filterFn || filterFn(filePath)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to export project wiki documentation
function exportWiki(sourceDir, outputDir) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define filter for wiki/documentation files
    const wikiFilter = (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();
      const relativePath = path.relative(sourceDir, filePath).toLowerCase();
      
      // Include documentation-related files
      const docExtensions = ['.md', '.mdx', '.txt'];
      const wikiPaths = ['wiki', 'docs', 'spec', 'plan', 'roadmap', 'tasks', 'contract', 'readme'];
      const wikiFiles = ['readme.md', 'license', 'contributing.md', 'changelog.md', 'todo.md'];
      
      // Check if it's in a wiki/documentation related directory
      const isInWikiPath = wikiPaths.some(wp => relativePath.includes(wp));
      
      // Check if it's a documentation file by extension or name
      const isDocFile = docExtensions.includes(ext) || wikiFiles.includes(fileName);
      
      return isInWikiPath || isDocFile;
    };

    // Get documentation files from the source directory
    const files = getAllFiles(sourceDir, [], wikiFilter);
    
    console.log(`Found ${files.length} wiki/documentation files to export`);
    
    // Copy each file to the output directory
    files.forEach((file) => {
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
    const summaryContent = `# Project Wiki Export Summary

Exported ${files.length} wiki/documentation files from the project.

## Exported Files:
${files.map(file => `- ${path.relative(sourceDir, file)}`).join('\n')}

Export completed on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(outputDir, 'WIKI_EXPORT_SUMMARY.md'), summaryContent);
    
    console.log(`\nProject wiki export completed successfully!`);
    console.log(`Exported to: ${outputDir}`);
    console.log(`Summary file created: WIKI_EXPORT_SUMMARY.md`);
    
  } catch (error) {
    console.error('Error exporting project wiki:', error.message);
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node export-project-wiki.js <source_directory> <output_directory>');
    console.log('Example: node export-project-wiki.js . ./project-wiki-export');
    process.exit(1);
  }
  
  const sourceDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  console.log(`Exporting project wiki from: ${sourceDir}`);
  console.log(`Exporting to: ${outputDir}`);
  
  exportWiki(sourceDir, outputDir);
}

main();