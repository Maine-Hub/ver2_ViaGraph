import { NextResponse } from 'next/server';

// Pure-JS PDF text extraction using pdfjs-dist (no native binaries needed)
async function parsePDF(buffer: Buffer): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Disable worker for server-side usage
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
        textParts.push(pageText);
    }

    return textParts.join('\n');
}

async function parseDOCX(buffer: Buffer): Promise<string> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

function extractJeepneyLines(text: string): { name: string; description: string }[] {
    const denominationCodes = ['PUJ', 'PUB', 'MC', 'UV EXPRESS', 'TAXI', 'TRICYCLE'];

    const lines = text
        .split(/[\n\r]+/)
        .map(l => l.trim())
        .filter(l => l.length > 3);

    const results: { name: string; description: string }[] = [];
    const seen = new Set<string>();

    for (let line of lines) {
        // Strip trailing denomination codes (e.g. "    PUJ", "  PUB")
        for (const code of denominationCodes) {
            const pattern = new RegExp(`\\s+${code}\\s*$`, 'i');
            line = line.replace(pattern, '').trim();
        }

        if (line.length < 4) continue;

        // Primary: LTFRB format — ALL CAPS with a dash
        // e.g. "ILIGAN PROPER-BURUUN", "ILIGAN PROPER- 542 PALAO"
        const isLtfrbRoute =
            line === line.toUpperCase() &&
            line.includes('-') &&
            line.length >= 8 &&
            line.length <= 120 &&
            !/^\d+$/.test(line);

        // Fallback: numbered routes "01 - Tibanga", "Route 1:", "PUJ Basinco"
        const isNumberedRoute =
            /^\d+[\.\)\-\s]/.test(line) ||
            /^route\s/i.test(line) ||
            /^puj\s/i.test(line);

        if ((isLtfrbRoute || isNumberedRoute) && !seen.has(line.toLowerCase())) {
            seen.add(line.toLowerCase());
            results.push({ name: line, description: '' });
        }
    }

    // Fallback: if nothing detected, return first 30 non-empty lines
    if (results.length === 0) {
        lines.slice(0, 30).forEach(line => {
            if (!seen.has(line.toLowerCase())) {
                seen.add(line.toLowerCase());
                results.push({ name: line, description: '' });
            }
        });
    }

    return results;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const type = file.name.toLowerCase();
        let text = '';

        if (type.endsWith('.pdf')) {
            text = await parsePDF(buffer);
        } else if (type.endsWith('.docx') || type.endsWith('.doc')) {
            text = await parseDOCX(buffer);
        } else {
            return NextResponse.json({ success: false, message: 'Unsupported file type. Use PDF or DOCX.' }, { status: 400 });
        }

        const lines = extractJeepneyLines(text);

        return NextResponse.json({
            success: true,
            lines,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
