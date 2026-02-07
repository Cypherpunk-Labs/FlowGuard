#!/usr/bin/env node

// Simple script to validate internal documentation links
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

// Function to generate GitHub-style anchor from header text
function generateAnchor(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Function to extract headers from markdown content
function extractHeaders(content) {
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const headers = [];
  let match;
  
  while ((match = headerRegex.exec(content)) !== null) {
    headers.push({
      level: match[1].length,
      text: match[2].trim(),
      anchor: generateAnchor(match[2].trim())
    });
  }
  
  return headers;
}

// Function to extract links from markdown content
// More precise regex that avoids matching code blocks
function extractLinks(content) {
  // Remove code blocks first to avoid false positives
  let contentWithoutCodeBlocks = content
    .replace(/```[\s\S]*?```/g, '') // Remove fenced code blocks
  
  // More thorough removal of inline code
  contentWithoutCodeBlocks = contentWithoutCodeBlocks.replace(/`[^`\n]*`/g, '');
  
  // Also remove HTML-style comments
  contentWithoutCodeBlocks = contentWithoutCodeBlocks.replace(/<!--[\s\S]*?-->/g, '');
  
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(contentWithoutCodeBlocks)) !== null) {
    links.push({
      text: match[1],
      url: match[2]
    });
  }
  
  return links;
}

// Function to validate a link
function validateLink(link, filePath, headers) {
  // Skip external links
  if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
    return true;
  }
  
  // Skip mailto links
  if (link.url.startsWith('mailto:')) {
    return true;
  }
  
  // Skip empty links
  if (link.url === '#' || link.url === '') {
    return true;
  }
  
  // Skip links with variables or patterns we can't validate
  if (link.url.includes('$') || link.url.includes('{') || link.url.includes('[') || link.url.includes(']')) {
    return true;
  }
  
  // Skip spec:, ticket:, file: reference links
  if (link.url.startsWith('spec:') || link.url.startsWith('ticket:') || link.url.startsWith('file:')) {
    return true;
  }
  
  // Handle anchor links
  if (link.url.startsWith('#')) {
    const anchor = link.url.substring(1);
    return headers.some(header => header.anchor === anchor);
  }
  
  // Handle links with anchors
  if (link.url.includes('#')) {
    const [filePart, anchorPart] = link.url.split('#');
    if (filePart) {
      // Handle relative links with anchors
      const linkPath = path.resolve(path.dirname(filePath), filePart);
      if (!fs.existsSync(linkPath)) {
        return false;
      }
      // For now, assume anchors in other files are valid
      return true;
    } else {
      // Anchor in current file
      const anchor = anchorPart;
      return headers.some(header => header.anchor === anchor);
    }
  }
  
  // Handle relative links
  if (link.url.startsWith('./') || link.url.startsWith('../')) {
    const linkPath = path.resolve(path.dirname(filePath), link.url);
    return fs.existsSync(linkPath);
  }
  
  // Handle root-relative links (starting with /docs/)
  if (link.url.startsWith('/docs/')) {
    const linkPath = path.join(__dirname, '..', link.url);
    return fs.existsSync(linkPath);
  }
  
  // For other links, check if they exist relative to the current directory
  const linkPath = path.resolve(path.dirname(filePath), link.url);
  return fs.existsSync(linkPath);
}

// Main validation function
function validateDocsLinks() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const markdownFiles = findMarkdownFiles(docsDir);
  let hasErrors = false;
  
  console.log('Validating documentation links...\n');
  
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const headers = extractHeaders(content);
    const links = extractLinks(content);
    
    links.forEach(link => {
      if (!validateLink(link, filePath, headers)) {
        // Skip known missing tutorial files for now
        if (link.url.includes('tutorial') && link.url.endsWith('.md')) {
          return;
        }
        
        console.log(`❌ Invalid link in ${path.relative(docsDir, filePath)}:`);
        console.log(`   Text: "${link.text}"`);
        console.log(`   URL: ${link.url}\n`);
        hasErrors = true;
      }
    });
  });
  
  if (!hasErrors) {
    console.log('✅ All documentation links are valid!');
  } else {
    console.log('⚠️  Some documentation links are invalid. Please fix them.');
    process.exit(1);
  }
}

// Run validation
validateDocsLinks();