interface ZipEntryInput {
    name: string;
    data: string | Uint8Array;
}

const textEncoder = new TextEncoder();

const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
        let value = i;
        for (let bit = 0; bit < 8; bit += 1) {
            if (value & 1) {
                value = (value >>> 1) ^ 0xedb88320;
            } else {
                value >>>= 1;
            }
        }
        table[i] = value >>> 0;
    }
    return table;
})();

function toUtf8Bytes(input: string): Uint8Array {
    return textEncoder.encode(input);
}

function crc32(bytes: Uint8Array): number {
    let value = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
        value = (value >>> 8) ^ CRC32_TABLE[(value ^ bytes[i]) & 0xff];
    }
    return (value ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date: Date): { dosDate: number; dosTime: number } {
    const year = Math.max(1980, date.getFullYear());
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    const dosDate = ((year - 1980) << 9) | (month << 5) | day;
    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    return { dosDate, dosTime };
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    chunks.forEach((chunk) => {
        merged.set(chunk, offset);
        offset += chunk.length;
    });
    return merged;
}

function createStoredZip(entries: ZipEntryInput[]): Uint8Array {
    const localChunks: Uint8Array[] = [];
    const centralChunks: Uint8Array[] = [];
    const now = new Date();
    const { dosDate, dosTime } = toDosDateTime(now);

    let localOffset = 0;
    entries.forEach((entry) => {
        const fileNameBytes = toUtf8Bytes(entry.name);
        const dataBytes = typeof entry.data === 'string' ? toUtf8Bytes(entry.data) : entry.data;
        const checksum = crc32(dataBytes);

        const localHeader = new Uint8Array(30 + fileNameBytes.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true);
        localView.setUint16(4, 20, true);
        localView.setUint16(6, 0, true);
        localView.setUint16(8, 0, true);
        localView.setUint16(10, dosTime, true);
        localView.setUint16(12, dosDate, true);
        localView.setUint32(14, checksum, true);
        localView.setUint32(18, dataBytes.length, true);
        localView.setUint32(22, dataBytes.length, true);
        localView.setUint16(26, fileNameBytes.length, true);
        localView.setUint16(28, 0, true);
        localHeader.set(fileNameBytes, 30);

        const centralHeader = new Uint8Array(46 + fileNameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true);
        centralView.setUint16(4, 20, true);
        centralView.setUint16(6, 20, true);
        centralView.setUint16(8, 0, true);
        centralView.setUint16(10, 0, true);
        centralView.setUint16(12, dosTime, true);
        centralView.setUint16(14, dosDate, true);
        centralView.setUint32(16, checksum, true);
        centralView.setUint32(20, dataBytes.length, true);
        centralView.setUint32(24, dataBytes.length, true);
        centralView.setUint16(28, fileNameBytes.length, true);
        centralView.setUint16(30, 0, true);
        centralView.setUint16(32, 0, true);
        centralView.setUint16(34, 0, true);
        centralView.setUint16(36, 0, true);
        centralView.setUint32(38, 0, true);
        centralView.setUint32(42, localOffset, true);
        centralHeader.set(fileNameBytes, 46);

        localChunks.push(localHeader, dataBytes);
        centralChunks.push(centralHeader);

        localOffset += localHeader.length + dataBytes.length;
    });

    const centralDirectory = concatBytes(centralChunks);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralDirectory.length, true);
    endView.setUint32(16, localOffset, true);
    endView.setUint16(20, 0, true);

    return concatBytes([...localChunks, centralDirectory, endRecord]);
}

export function createWordHtmlDocument(contentHtml: string): string {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="vibe-101-publish" />
  <style>
    body { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`;
}

export function createWordDocBlob(contentHtml: string): Blob {
    const html = createWordHtmlDocument(contentHtml);
    return new Blob([html], { type: 'application/msword' });
}

export function createWordDocxBlob(contentHtml: string): Blob {
    const html = createWordHtmlDocument(contentHtml);

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="html" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const packageRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="rId1"/>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.html"/>
</Relationships>`;

    const archiveBytes = createStoredZip([
        { name: '[Content_Types].xml', data: contentTypes },
        { name: '_rels/.rels', data: packageRels },
        { name: 'word/document.xml', data: documentXml },
        { name: 'word/_rels/document.xml.rels', data: documentRels },
        { name: 'word/afchunk.html', data: html }
    ]);

    return new Blob([archiveBytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}
