#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory with filtering
function getAllFiles(dirPath, arrayOfFiles = [], filterFn) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (file !== 'node_modules' && file !== '.git' && file !== 'out') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles, filterFn);
      }
    } else {
      // Apply filter function if provided
      if (!filterFn || filterFn(filePath)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to export wiki documentation
function exportWiki(sourceDir, outputDir) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define filter for documentation files
    const docFilter = (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();
      
      // Include documentation-related files
      const docExtensions = ['.md', '.mdx', '.txt', '.pdf', '.doc', '.docx'];
      const docFiles = ['readme', 'license', 'contributing', 'changelog', 'todo'];
      
      return docExtensions.includes(ext) || 
             docFiles.includes(fileName.replace(ext, '')) ||
             filePath.includes('wiki') ||
             filePath.includes('docs') ||
             filePath.includes('spec') ||
             filePath.includes('plan') ||
             filePath.includes('roadmap') ||
             filePath.includes('tasks') ||
             filePath.includes('contract');
    };

    // Get documentation files from the source directory
    const files = getAllFiles(sourceDir, [], docFilter);
    
    console.log(`Found ${files.length} documentation files to export`);
    
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
    const summaryContent = `# Repository Wiki Export Summary

Exported ${files.length} documentation files from the repository.

## Exported Files:
${files.map(file => `- ${path.relative(sourceDir, file)}`).join('\n')}

Export completed on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(outputDir, 'EXPORT_SUMMARY.md'), summaryContent);
    
    console.log(`\nWiki export completed successfully!`);
    console.log(`Exported to: ${outputDir}`);
    console.log(`Summary file created: EXPORT_SUMMARY.md`);
    
  } catch (error) {
    console.error('Error exporting wiki:', error.message);
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node export-wiki-docs.js <source_directory> <output_directory>');
    console.log('Example: node export-wiki-docs.js ./docs ./exported-wiki');
    process.exit(1);
  }
  
  const sourceDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  console.log(`Exporting wiki documentation from: ${sourceDir}`);
  console.log(`Exporting to: ${outputDir}`);
  
  exportWiki(sourceDir, outputDir);
}

main();