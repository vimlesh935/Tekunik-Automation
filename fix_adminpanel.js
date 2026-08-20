const fs = require('fs');
const path = 'c:/Users/visha/Desktop/Tekunik/Automation/frontend/src/pages/AdminPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the duplicate opening line - try all line ending combinations
const patterns = [
  "  const fetchAllProducts = useCallback(async () => {\r\n  const fetchAllProducts = useCallback(async () => {",
  "  const fetchAllProducts = useCallback(async () => {\n  const fetchAllProducts = useCallback(async () => {",
  "  const fetchAllProducts = useCallback(async () => {\r  const fetchAllProducts = useCallback(async () => {",
];

let fixed = false;
for (const pattern of patterns) {
  if (content.includes(pattern)) {
    content = content.replace(pattern, "  const fetchAllProducts = useCallback(async () => {");
    fixed = true;
    console.log('Fixed with pattern:', JSON.stringify(pattern.slice(0, 60)));
    break;
  }
}

if (!fixed) {
  // Count occurrences
  const count = (content.match(/const fetchAllProducts = useCallback/g) || []).length;
  console.log('NOT FIXED. Occurrences found:', count);
  // Show context around first occurrence
  const idx = content.indexOf('const fetchAllProducts = useCallback');
  console.log('Context:', JSON.stringify(content.slice(idx - 2, idx + 120)));
} else {
  fs.writeFileSync(path, content, 'utf8');
  console.log('File saved successfully.');
}
