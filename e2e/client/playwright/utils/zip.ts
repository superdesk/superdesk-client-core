import {inflateRawSync} from 'zlib';

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_HEADER_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const END_OF_CENTRAL_DIRECTORY_LENGTH = 22;
const CENTRAL_FILE_HEADER_LENGTH = 46;
const LOCAL_FILE_HEADER_LENGTH = 30;
const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATED = 8;

/**
 * Reads a ZIP into a `filename -> UTF-8 contents` map. Hand-rolled because `e2e/client`
 * has no ZIP dependency; handles only stored and deflate, which is what Python's
 * `zipfile` produces. For small text payloads only.
 */
export function readZipEntries(archive: Buffer): Map<string, string> {
    const endOfCentralDirectory = findEndOfCentralDirectory(archive);
    const entryCount = archive.readUInt16LE(endOfCentralDirectory + 10);
    const entries = new Map<string, string>();

    let cursor = archive.readUInt32LE(endOfCentralDirectory + 16);

    for (let i = 0; i < entryCount; i++) {
        if (archive.readUInt32LE(cursor) !== CENTRAL_FILE_HEADER_SIGNATURE) {
            throw new Error(`corrupt ZIP: central directory entry ${i} carries no file header signature`);
        }

        const compressionMethod = archive.readUInt16LE(cursor + 10);
        const compressedSize = archive.readUInt32LE(cursor + 20);
        const nameLength = archive.readUInt16LE(cursor + 28);
        const extraLength = archive.readUInt16LE(cursor + 30);
        const commentLength = archive.readUInt16LE(cursor + 32);
        const localHeaderOffset = archive.readUInt32LE(cursor + 42);
        const nameStart = cursor + CENTRAL_FILE_HEADER_LENGTH;
        const name = archive.toString('utf8', nameStart, nameStart + nameLength);

        entries.set(name, readEntryContents(archive, localHeaderOffset, compressionMethod, compressedSize));

        cursor = nameStart + nameLength + extraLength + commentLength;
    }

    return entries;
}

// An archive comment can follow this record, so scan for it instead of using the length.
function findEndOfCentralDirectory(archive: Buffer): number {
    for (let offset = archive.length - END_OF_CENTRAL_DIRECTORY_LENGTH; offset >= 0; offset--) {
        if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
            return offset;
        }
    }

    throw new Error('not a ZIP archive: no end-of-central-directory record');
}

function readEntryContents(
    archive: Buffer,
    localHeaderOffset: number,
    compressionMethod: number,
    compressedSize: number,
): string {
    if (archive.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
        throw new Error('corrupt ZIP: entry carries no local file header signature');
    }

    // Local name/extra lengths may differ from the central directory's; use these.
    const nameLength = archive.readUInt16LE(localHeaderOffset + 26);
    const extraLength = archive.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + LOCAL_FILE_HEADER_LENGTH + nameLength + extraLength;
    const data = archive.subarray(dataStart, dataStart + compressedSize);

    if (compressionMethod === COMPRESSION_STORED) {
        return data.toString('utf8');
    }

    if (compressionMethod === COMPRESSION_DEFLATED) {
        return inflateRawSync(data).toString('utf8');
    }

    throw new Error(`unsupported ZIP compression method: ${compressionMethod}`);
}
