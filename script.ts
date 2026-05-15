import * as fs from 'fs';

const content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

const startStr = "      {/* Product Details Modal */}\n      <AnimatePresence>\n        {selectedProduct && (\n          <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4\">\n            <motion.div\n              initial={{ opacity: 0 }}\n              animate={{ opacity: 1 }}\n              exit={{ opacity: 0 }}\n              onClick={() => setSelectedProduct(null)}\n              className=\"absolute inset-0 bg-[#064e3b]/80 backdrop-blur-md\"\n            />";

const startIdx = content.indexOf("      {/* Product Details Modal */}");
const endStr = "      </AnimatePresence>\n      </div>\n    </div>\n  );\n}";
const endIdx = content.indexOf(endStr);

const block = content.substring(startIdx, endIdx + "      </AnimatePresence>\n".length);

const targetInsert = `            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-[#064e3b]/10"></div>
              <h2 className="text-xl font-serif font-black text-[#fbbf24] uppercase tracking-[0.2em] whitespace-nowrap">
                {selectedCategory ? \`\${CATEGORIES.find(c => c.id === selectedCategory)?.name}\` : t('our_collection')}
              </h2>
              <div className="h-px flex-1 bg-[#064e3b]/10"></div>
            </div>

            {loading ? (`

let newBlock = block.replace('<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">', '<div className="mb-12 relative w-full">');
newBlock = newBlock.replace(`            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-[#064e3b]/80 backdrop-blur-md"
            />
`, '');
newBlock = newBlock.replace('max-h-[90vh] overflow-y-auto', '');
newBlock = newBlock.replace('className="absolute top-4 right-4 md:top-6 md:right-6 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"', 'className="absolute top-4 right-4 md:top-6 md:right-6 z-10 p-2 bg-black/50 hover:bg-[#fbbf24] text-white hover:text-black rounded-full transition-colors backdrop-blur-md"');

const newContent = content.substring(0, startIdx) + "      </div>\n    </div>\n  );\n}";

const insertIdx = newContent.indexOf(targetInsert);
const finalContent = newContent.substring(0, insertIdx + targetInsert.length).replace(targetInsert, targetInsert + `\n\n` + newBlock) + newContent.substring(insertIdx + targetInsert.length);

fs.writeFileSync('src/pages/HomePage.tsx', finalContent);
console.log("Done");
