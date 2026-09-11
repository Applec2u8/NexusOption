const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}
const files = walk('src');
let updatedCount = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('bg-input-bg') || content.includes('border-input-border')) {
    content = content.replace(/bg-input-bg/g, 'bg-transparent').replace(/border-input-border/g, 'border-border');
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
    updatedCount++;
  }
});
console.log('Total files updated: ' + updatedCount);
