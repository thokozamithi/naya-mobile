#!/usr/bin/env node
/**
 * Static navigation & button wiring checker for Naya Mobile.
 *
 * Run: node scripts/check-navigation.js
 *
 * 1. Extracts all registered screen names from RootNavigator.tsx
 * 2. Scans all screen files for navigation.navigate('...') calls
 * 3. Reports any navigate() targets that don't match a registered screen
 * 4. Detects TouchableOpacity/Pressable without onPress handlers
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const NAV_FILE = path.join(SRC, 'navigation', 'RootNavigator.tsx');

// ---- helpers ----
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function walkDir(dir, ext, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, ext, results);
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ---- 1. Extract registered screen names ----
const navContent = readFile(NAV_FILE);
const screenNameRegex = /name="([^"]+)"/g;
const registeredScreens = new Set();
let match;
while ((match = screenNameRegex.exec(navContent)) !== null) {
  registeredScreens.add(match[1]);
}

console.log('=== Registered Screen Names ===');
console.log([...registeredScreens].sort().join('\n'));
console.log(`Total: ${registeredScreens.size}\n`);

// ---- 2. Scan for navigation.navigate() calls ----
const screenFiles = walkDir(path.join(SRC, 'screens'), '.tsx');
const allFiles = [...screenFiles, ...walkDir(path.join(SRC, 'navigation'), '.tsx')];

const navigateRegex = /navigation\.navigate\(\s*['"]([^'"]+)['"]/g;
const navigateAsNeverRegex = /navigation\.navigate\(\s*['"]([^'"]+)['"]\s+as\s+never/g;

let brokenNavCount = 0;
const brokenNavs = [];

for (const file of allFiles) {
  const content = readFile(file);
  const rel = path.relative(SRC, file);
  let m;

  // Check navigate('ScreenName') calls
  const navRegex = /navigate\(\s*['"]([^'"]+)['"]/g;
  while ((m = navRegex.exec(content)) !== null) {
    const target = m[1];
    if (!registeredScreens.has(target)) {
      // Check if it's a tab screen name (could be valid for tab navigation)
      const lineNum = content.substring(0, m.index).split('\n').length;
      brokenNavs.push({ file: rel, line: lineNum, target });
      brokenNavCount++;
    }
  }
}

console.log('=== Navigation Target Check ===');
if (brokenNavs.length === 0) {
  console.log('All navigate() targets match registered screens.\n');
} else {
  console.log(`Found ${brokenNavCount} potentially unregistered navigation targets:\n`);
  for (const b of brokenNavs) {
    console.log(`  ${b.file}:${b.line} -> navigate('${b.target}')`);
  }
  console.log('');
}

// ---- 3. Detect TouchableOpacity without onPress ----
const touchableRegex = /<(TouchableOpacity|Pressable)\b([^>]*?)>/gs;
const onPressRegex = /onPress/;

let missingHandlerCount = 0;
const missingHandlers = [];

for (const file of screenFiles) {
  const content = readFile(file);
  const rel = path.relative(SRC, file);
  let tm;

  while ((tm = touchableRegex.exec(content)) !== null) {
    const fullTag = tm[0];
    // Check if onPress is in the tag attributes or if the tag is self-closing
    // For multiline tags we need to find the closing >
    const startIdx = tm.index;
    let endIdx = startIdx + fullTag.length;

    // If the tag isn't self-closing, find the > that ends the opening tag
    if (!fullTag.endsWith('/>') && !fullTag.endsWith('>')) {
      const rest = content.substring(startIdx);
      const closeIdx = rest.indexOf('>');
      endIdx = startIdx + closeIdx + 1;
    }

    const tagContent = content.substring(startIdx, endIdx);
    if (!onPressRegex.test(tagContent)) {
      const lineNum = content.substring(0, startIdx).split('\n').length;
      missingHandlers.push({ file: rel, line: lineNum, component: tm[1] });
      missingHandlerCount++;
    }
  }
}

console.log('=== Missing onPress Handler Check ===');
if (missingHandlers.length === 0) {
  console.log('All touchable components have onPress handlers.\n');
} else {
  console.log(`Found ${missingHandlerCount} touchable components without onPress:\n`);
  for (const mh of missingHandlers) {
    console.log(`  ${mh.file}:${mh.line} -> <${mh.component}> missing onPress`);
  }
  console.log('');
}

// ---- 4. Summary ----
console.log('=== Summary ===');
const issues = brokenNavCount + missingHandlerCount;
if (issues === 0) {
  console.log('No navigation or button wiring issues detected.');
} else {
  console.log(`${issues} issue(s) found. Review above for details.`);
}

process.exit(issues > 0 ? 1 : 0);
