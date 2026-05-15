import * as fs from 'fs';

const content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

const startStr = "      {/* Product Details Modal */}";
const endStr = "      </AnimatePresence>";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr) + endStr.length;

const block = content.substring(startIdx, endIdx);

// Remove the block and the newlines around it
let newContent = content.substring(0, startIdx) + content.substring(endIdx);

// We want to insert it right before `{loading ? (`
// Note that right now, `newContent` looks like:
// `            {loading ? (\n\n\n              <div className="grid grid-cols-1`
// We need to move the block before `{loading ? (`
// Oh wait, my previous script replaced `targetInsert` with exactly `targetInsert` PLUS `newBlock`.
// `targetInsert` ended with `{loading ? (`
// So the pattern `{loading ? (` is BEFORE the block in `content`.

// Let's just fix the whole string substitution.
const targetToFix = `{loading ? (\n\n      {/* Product Details Modal */}`;
if (content.includes(targetToFix)) {
    let fixedContent = content.replace(targetToFix, `      {/* Product Details Modal */}`);
    fixedContent = fixedContent.replace(`</AnimatePresence>\n\n              <div className="grid grid-cols-1`, `</AnimatePresence>\n\n            {loading ? (\n              <div className="grid grid-cols-1`);
    fs.writeFileSync('src/pages/HomePage.tsx', fixedContent);
    console.log("Fixed 1");
} else {
    console.log("targetToFix not found, let's try regex");
}
