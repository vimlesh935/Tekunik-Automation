const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "frontend", "src");
const localesRoot = path.join(srcRoot, "locales");

const USER_SOURCE_DIRS = ["components", "context", "hooks", "pages", "utils"];
const IGNORED_PATH_PARTS = [
  `${path.sep}admin${path.sep}`,
  `${path.sep}pages${path.sep}admin${path.sep}`,
  `${path.sep}locales${path.sep}`,
];

const TECHNICAL_LITERALS = [
  /^[a-z0-9_.:/?&=%#-]+$/i,
  /^#[0-9a-f]{3,8}$/i,
  /^(GET|POST|PUT|PATCH|DELETE|Bearer|Content-Type|application\/json)$/i,
  /^(text|number|email|password|button|submit|checkbox|radio|file|hidden)$/i,
  /^(true|false|null|undefined)$/i,
  /^\/[a-z0-9_/:.?=&-]*$/i,
  /^https?:\/\//i,
  /^[A-Z0-9_]+$/,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (IGNORED_PATH_PARTS.some((part) => fullPath.includes(part))) continue;
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.[jt]sx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getLine(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function getByPath(object, key) {
  return key.split(".").reduce((cursor, part) => {
    if (!cursor || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    return cursor[part];
  }, object);
}

function hasKeyOrPlural(object, key) {
  if (getByPath(object, key) !== undefined) return true;
  const parent = key.split(".").slice(0, -1).reduce((cursor, part) => {
    if (!cursor || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    return cursor[part];
  }, object);
  const base = key.split(".").at(-1);
  if (!parent || typeof parent !== "object") return false;
  return Object.keys(parent).some((part) => part === base || part.startsWith(`${base}_`));
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => " ".repeat(match.length))
    .replace(/(^|[^:])\/\/.*$/gm, (match, prefix) => `${prefix}${" ".repeat(match.length - prefix.length)}`);
}

function isLikelyUserText(value) {
  const text = String(value || "").trim();
  if (text.length < 3) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (TECHNICAL_LITERALS.some((pattern) => pattern.test(text))) return false;
  if (/^(className|aria-|data-|on[A-Z]|to|href|src|alt|type|role|key)$/.test(text)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(text) && text.length < 16) return false;
  return true;
}

function findTranslationKeys(files) {
  const keys = new Map();
  const keyPattern = /\bt\(\s*["']([^"']+)["']/g;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    let match;
    while ((match = keyPattern.exec(source))) {
      const key = match[1];
      if (!keys.has(key)) keys.set(key, []);
      keys.get(key).push({
        file: path.relative(repoRoot, file),
        line: getLine(source, match.index),
      });
    }
  }

  return keys;
}

function findHardcodedStrings(files) {
  const findings = [];
  const stringPattern = /(?<![\w$])(["'`])((?:\\.|(?!\1)[\s\S])*?[A-Za-z][\s\S]*?)\1/g;
  const ignoredContexts = [
    /\b(import|from|require)\s*\(?\s*$/,
    /\bconsole\.(log|warn|error|info|debug)\s*\([^)]*$/,
    /\bt\(\s*$/,
    /\btoast\(\s*$/,
  ];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const clean = stripComments(source);
    let match;
    while ((match = stringPattern.exec(clean))) {
      const raw = match[2].replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
      if (!isLikelyUserText(raw)) continue;

      const before = clean.slice(Math.max(0, match.index - 80), match.index);
      if (ignoredContexts.some((pattern) => pattern.test(before))) continue;
      if (/\b(className|style|variants|initial|animate|exit|whileHover|transition|layoutId)\s*:\s*$/.test(before)) continue;
      if (/\b(className|to|href|src|method|endpoint|url|icon|color|bg|border|shadow|key|id|name|value|type|role|target|rel|autoComplete)\s*=\s*$/.test(before)) continue;

      findings.push({
        file: path.relative(repoRoot, file),
        line: getLine(source, match.index),
        text: raw.slice(0, 160),
      });
    }
  }

  return findings;
}

function main() {
  const files = USER_SOURCE_DIRS.flatMap((dir) => {
    const fullPath = path.join(srcRoot, dir);
    return fs.existsSync(fullPath) ? walk(fullPath) : [];
  });

  const keys = findTranslationKeys(files);
  const hardcoded = findHardcodedStrings(files);
  const localeFiles = fs.readdirSync(localesRoot).filter((file) => file.endsWith(".json")).sort();

  console.log(`User source files scanned: ${files.length}`);
  console.log(`Translation keys referenced: ${keys.size}`);
  console.log(`Likely hardcoded user strings: ${hardcoded.length}`);

  if (hardcoded.length) {
    console.log("\nHardcoded string findings:");
    for (const finding of hardcoded) {
      console.log(`${finding.file}:${finding.line} - ${finding.text}`);
    }
  }

  console.log("\nLocale coverage:");
  for (const localeFile of localeFiles) {
    const locale = JSON.parse(fs.readFileSync(path.join(localesRoot, localeFile), "utf8"));
    const missing = [...keys.keys()].filter((key) => !hasKeyOrPlural(locale, key));
    console.log(`${localeFile}: ${missing.length} missing`);
    for (const key of missing.slice(0, 80)) {
      const refs = keys.get(key).map((ref) => `${ref.file}:${ref.line}`).join(", ");
      console.log(`  ${key} <- ${refs}`);
    }
    if (missing.length > 80) console.log(`  ... ${missing.length - 80} more`);
  }
}

main();
