import mammoth from 'mammoth';
import fs from 'fs';

async function main() {
  const filePath = 'system_development_framework.docx';
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist.`);
    return;
  }
  
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    fs.writeFileSync('scratch/docx_extracted_text.txt', text);
    console.log('Successfully extracted text to scratch/docx_extracted_text.txt. Character length:', text.length);

    // Search for keywords
    const keywords = ['transfer-capable', 'transfer capable', '52 key locations', '78 route blocks'];
    keywords.forEach(kw => {
      const idx = text.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1) {
        console.log(`\nMatch found for "${kw}" at index ${idx}:`);
        console.log(text.substring(Math.max(0, idx - 150), Math.min(text.length, idx + kw.length + 150)));
      } else {
        console.log(`No match for "${kw}"`);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
