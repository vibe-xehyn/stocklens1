const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/Users/mac/Desktop/vibecoding/stock-dashboard/public/index.html', 'utf8');

// Simple regex to extract script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 1;

while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1];
  console.log(`Checking script block ${scriptIndex++}...`);
  try {
    new vm.Script(code);
    console.log('  ✓ No syntax errors');
  } catch (e) {
    console.error('  ✗ Syntax Error:', e.message);
    // Print lines around the error
    const lines = code.split('\n');
    const stack = e.stack || '';
    const matchLine = stack.match(/evalmachine\.<anonymous>:(\d+)/);
    if (matchLine) {
      const errorLineNum = parseInt(matchLine[1]);
      console.error(`Error around line ${errorLineNum}:`);
      for (let i = Math.max(0, errorLineNum - 5); i < Math.min(lines.length, errorLineNum + 5); i++) {
        console.error(`${i + 1}: ${lines[i]}`);
      }
    } else {
      console.error(e.stack);
    }
  }
}
