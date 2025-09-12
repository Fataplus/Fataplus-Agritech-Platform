#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
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

    // Get all files from the source directory
    const files = getAllFiles(sourceDir);
    
    console.log(`Found ${files.length} files to export`);
    
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
    
    console.log(`\nWiki export completed successfully!`);
    console.log(`Exported to: ${outputDir}`);
    
  } catch (error) {
    console.error('Error exporting wiki:', error.message);
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node export-repo-wiki.js <source_directory> <output_directory>');
    console.log('Example: node export-repo-wiki.js ./docs ./exported-wiki');
    process.exit(1);
  }
  
  const sourceDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  console.log(`Exporting wiki from: ${sourceDir}`);
  console.log(`Exporting to: ${outputDir}`);
  
  exportWiki(sourceDir, outputDir);
}

main();