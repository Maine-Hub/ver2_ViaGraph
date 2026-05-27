import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function extractPdfText() {
    const dataBuffer = fs.readFileSync('Iligan_Routes.pdf');
    try {
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        fs.writeFileSync('iligan_routes_text.txt', data.text);
        console.log('Successfully extracted text to iligan_routes_text.txt');
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

extractPdfText();
