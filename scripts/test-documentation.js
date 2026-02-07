#!/usr/bin/env node

// Comprehensive documentation testing script
const fs = require('fs');
const path = require('path');

// Function to find all markdown files in docs directory
function findMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to check for broken internal links
function checkInternalLinks(markdownFiles) {
  console.log('Checking for broken internal links...');
  let hasErrors = false;
  
  // This would be a more comprehensive check that validates all links
  // For now, we'll just run our existing validation script
  try {
    require('./validate-docs-links.js');
  } catch (error) {
    console.error('Link validation failed:', error.message);
    hasErrors = true;
  }
  
  return !hasErrors;
}

// Function to check for proper heading hierarchy
function checkHeadingHierarchy(markdownFiles) {
  console.log('Checking heading hierarchy...');
  let hasErrors = false;
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let currentLevel = 0;
    
    lines.forEach((line, index) => {
      // Skip code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) return;
      
      // Check for headings
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s*/, '');
        
        // Check if heading level increases by more than 1
        if (level > currentLevel + 1) {
          console.log(`⚠️  Heading hierarchy issue in ${path.relative(path.join(__dirname, '..'), filePath)} line ${index + 1}:`);
          console.log(`   "${text}" jumps from level ${currentLevel} to ${level}\n`);
          hasErrors = true;
        }
        
        currentLevel = level;
      }
    });
  });
  
  return !hasErrors;
}

// Function to check for proper list formatting
function checkListFormatting(markdownFiles) {
  console.log('Checking list formatting...');
  let hasErrors = false;
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    
    lines.forEach((line, index) => {
      // Skip code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) return;
      
      // Check for unordered lists
      if (line.match(/^\s*-\s/)) {
        if (inList && listType !== 'ul') {
          console.log(`⚠️  List formatting issue in ${path.relative(path.join(__dirname, '..'), filePath)} line ${index + 1}:`);
          console.log(`   Mixed list types\n`);
          hasErrors = true;
        }
        inList = true;
        listType = 'ul';
      }
      // Check for ordered lists
      else if (line.match(/^\s*\d+\.\s/)) {
        if (inList && listType !== 'ol') {
          console.log(`⚠️  List formatting issue in ${path.relative(path.join(__dirname, '..'), filePath)} line ${index + 1}:`);
          console.log(`   Mixed list types\n`);
          hasErrors = true;
        }
        inList = true;
        listType = 'ol';
      }
      // Check if we're exiting a list
      else if (line.trim() === '') {
        inList = false;
        listType = null;
      }
      else if (inList && !line.match(/^\s*[*-]\s/) && !line.match(/^\s*\d+\.\s/)) {
        // We're in a list but this line doesn't continue or start a list item
        inList = false;
        listType = null;
      }
    });
  });
  
  return !hasErrors;
}

// Function to check for proper code block formatting
function checkCodeBlocks(markdownFiles) {
  console.log('Checking code block formatting...');
  let hasErrors = false;
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let codeBlockLanguage = null;
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Starting a code block
          inCodeBlock = true;
          codeBlockLanguage = line.trim().substring(3);
          
          // Check if language is specified
          if (codeBlockLanguage === '') {
            console.log(`⚠️  Unspecified code block language in ${path.relative(path.join(__dirname, '..'), filePath)} line ${index + 1}`);
            hasErrors = true;
          }
        } else {
          // Ending a code block
          inCodeBlock = false;
          codeBlockLanguage = null;
        }
      }
    });
    
    // Check for unclosed code blocks
    if (inCodeBlock) {
      console.log(`❌ Unclosed code block in ${path.relative(path.join(__dirname, '..'), filePath)}`);
      hasErrors = true;
    }
  });
  
  return !hasErrors;
}

// Function to check for proper table formatting
function checkTableFormatting(markdownFiles) {
  console.log('Checking table formatting...');
  let hasErrors = false;
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    
    lines.forEach((line, index) => {
      // Skip code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) return;
      
      // Check for tables (lines with | characters)
      if (line.includes('|') && line.includes('-|-')) {
        // This is likely a table separator line
        // Check if it has the right format
        const trimmed = line.trim();
        if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
          console.log(`⚠️  Table formatting issue in ${path.relative(path.join(__dirname, '..'), filePath)} line ${index + 1}:`);
          console.log(`   Table rows should start and end with | characters\n`);
          hasErrors = true;
        }
      }
    });
  });
  
  return !hasErrors;
}

// Main validation function
function testDocumentation() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const markdownFiles = findMarkdownFiles(docsDir);
  
  console.log(`Found ${markdownFiles.length} markdown files to test\n`);
  
  let allTestsPassed = true;
  
  // Run all tests
  allTestsPassed &= checkInternalLinks(markdownFiles);
  allTestsPassed &= checkHeadingHierarchy(markdownFiles);
  allTestsPassed &= checkListFormatting(markdownFiles);
  allTestsPassed &= checkCodeBlocks(markdownFiles);
  allTestsPassed &= checkTableFormatting(markdownFiles);
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All documentation tests passed!');
  } else {
    console.log('⚠️  Some documentation tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run tests
testDocumentation();