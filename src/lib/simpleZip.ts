export interface ZipFileEntry {
    name: string;
    data: Uint8Array;
    lastModified?: Date;
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) === 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
    }
    return value >>> 0;
});

function computeCrc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let index = 0; index < data.length; index += 1) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[index]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function toDosTime(date: Date): number {
    const seconds = Math.floor(date.getSeconds() / 2);
    const minutes = date.getMinutes();
    const hours = date.getHours();
    return (hours << 11) | (minutes << 5) | seconds;
}

function toDosDate(date: Date): number {
    const year = Math.max(1980, date.getFullYear());
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return ((year - 1980) << 9) | (month << 5) | day;
}

function createLocalHeader(
    fileNameBytes: Uint8Array,
    crc32: number,
    size: number,
    dosTime: number,
    dosDate: number
) {
    const header = new Uint8Array(30 + fileNameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc32, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, fileNameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(fileNameBytes, 30);
    return header;
}

function createCentralDirectoryHeader(
    fileNameBytes: Uint8Array,
    crc32: number,
    size: number,
    dosTime: number,
    dosDate: number,
    offset: number
) {
    const header = new Uint8Array(46 + fileNameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, dosTime, true);
    view.setUint16(14, dosDate, true);
    view.setUint32(16, crc32, true);
    view.setUint32(20, size, true);
    view.setUint32(24, size, true);
    view.setUint16(28, fileNameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, offset, true);
    header.set(fileNameBytes, 46);
    return header;
}

function createEndOfCentralDirectory(fileCount: number, centralDirectorySize: number, centralDirectoryOffset: number) {
    const header = new Uint8Array(22);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, fileCount, true);
    view.setUint16(10, fileCount, true);
    view.setUint32(12, centralDirectorySize, true);
    view.setUint32(16, centralDirectoryOffset, true);
    view.setUint16(20, 0, true);
    return header;
}

export function createZipBlob(entries: ZipFileEntry[]): Blob {
    const encoder = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    entries.forEach((entry) => {
        const normalizedDate = entry.lastModified ?? new Date();
        const fileNameBytes = encoder.encode(entry.name);
        const crc32 = computeCrc32(entry.data);
        const size = entry.data.length;
        const dosTime = toDosTime(normalizedDate);
        const dosDate = toDosDate(normalizedDate);
        const localHeader = createLocalHeader(fileNameBytes, crc32, size, dosTime, dosDate);
        const centralHeader = createCentralDirectoryHeader(fileNameBytes, crc32, size, dosTime, dosDate, offset);

        localParts.push(localHeader, entry.data);
        centralParts.push(centralHeader);
        offset += localHeader.length + size;
    });

    const centralDirectoryOffset = offset;
    const centralDirectorySize = centralParts.reduce((total, part) => total + part.length, 0);
    const endHeader = createEndOfCentralDirectory(entries.length, centralDirectorySize, centralDirectoryOffset);

    return new Blob([...localParts, ...centralParts, endHeader], { type: 'application/zip' });
}
