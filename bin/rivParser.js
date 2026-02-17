/**
 * Minimal .riv binary parser to extract artboard names.
 * Based on Rive runtime format: https://rive.app/docs/runtimes/advanced-topic/format
 *
 * Core type keys (from rive-runtime dev/defs):
 * - Artboard = 1
 * - Component.name property = 4 (String)
 */

const RIVE_FINGERPRINT = Buffer.from([0x52, 0x49, 0x56, 0x45]); // "RIVE"
const ARTBOARD_OBJECT_TYPE = 1;
const COMPONENT_NAME_PROPERTY_KEY = 4;

/** Backing types for skipping values (2 bits in ToC) */
const BackingType = {
  UintBool: 0,
  String: 1,
  Float: 2,
  Color: 3,
};

function createReader(buffer) {
  let offset = 0;
  return {
    eof() {
      return offset >= buffer.length;
    },
    remaining() {
      return buffer.length - offset;
    },
    readUint8() {
      if (offset >= buffer.length) throw new Error('Rive: unexpected end of file');
      return buffer[offset++];
    },
    readUint32LE() {
      if (offset + 4 > buffer.length) throw new Error('Rive: unexpected end of file');
      const v = buffer.readUInt32LE(offset);
      offset += 4;
      return v;
    },
    readVaruint() {
      let result = 0;
      let shift = 0;
      while (offset < buffer.length) {
        const byte = buffer[offset++];
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) return result;
        shift += 7;
        if (shift > 35) throw new Error('Rive: invalid varuint');
      }
      throw new Error('Rive: unexpected end of file');
    },
    readString() {
      const len = this.readVaruint();
      if (offset + len > buffer.length) throw new Error('Rive: unexpected end of file');
      const s = buffer.subarray(offset, offset + len).toString('utf8');
      offset += len;
      return s;
    },
    skip(count) {
      if (offset + count > buffer.length) throw new Error('Rive: unexpected end of file');
      offset += count;
    },
    get offset() {
      return offset;
    },
  };
}

/**
 * Parse ToC: property keys (varuints until 0) then 2 bits per property for backing type.
 * Returns Map<propertyKey, 0|1|2|3>.
 */
function parseToc(reader) {
  const propertyKeys = [];
  let key;
  while ((key = reader.readVaruint()) !== 0) {
    propertyKeys.push(key);
  }
  // 2 bits per property; align to 4-byte boundary so object stream starts correctly
  const numBytes = Math.ceil((propertyKeys.length * 2) / 8);
  const alignedNumBytes = Math.ceil(numBytes / 4) * 4;
  const typeBytes = [];
  for (let i = 0; i < alignedNumBytes; i++) {
    typeBytes.push(reader.readUint8());
  }
  const toc = new Map();
  propertyKeys.forEach((k, i) => {
    const byteIndex = i >> 2;
    const shift = (i & 3) * 2;
    const twoBits = (typeBytes[byteIndex] >> shift) & 3;
    toc.set(k, twoBits);
  });
  return toc;
}

function skipPropertyValue(reader, backingType) {
  switch (backingType) {
    case BackingType.UintBool:
      reader.skip(4);
      break;
    case BackingType.String: {
      const len = reader.readVaruint();
      reader.skip(len);
      break;
    }
    case BackingType.Float:
    case BackingType.Color:
      reader.skip(4);
      break;
    default:
      reader.skip(4);
  }
}

/**
 * Extract artboard names from a .riv file buffer.
 * @param {Buffer} buffer - Raw contents of the .riv file
 * @returns {{ artboardNames: string[], major: number, minor: number }}
 */
function parseRivFile(buffer) {
  if (buffer.length < 4) throw new Error('Rive: file too short');
  const reader = createReader(buffer);

  const fingerprint = buffer.subarray(0, 4);
  if (!fingerprint.equals(RIVE_FINGERPRINT)) {
    throw new Error('Rive: invalid file (not a .riv file)');
  }
  reader.skip(4);

  const major = reader.readVaruint();
  const minor = reader.readVaruint();
  const fileId = reader.readVaruint();

  if (major !== 7) {
    throw new Error(`Rive: unsupported format version ${major}.${minor} (expected major 7)`);
  }

  const toc = parseToc(reader);
  const artboardNames = [];

  try {
    while (!reader.eof() && reader.remaining() >= 2) {
      const objectType = reader.readVaruint();
      if (objectType === ARTBOARD_OBJECT_TYPE) {
        let name = '';
        for (;;) {
          const propKey = reader.readVaruint();
          if (propKey === 0) break;
          const backingType = toc.get(propKey) ?? 0;
          if (propKey === COMPONENT_NAME_PROPERTY_KEY && backingType === BackingType.String) {
            name = reader.readString();
          } else {
            skipPropertyValue(reader, backingType);
          }
        }
        artboardNames.push(name);
      } else {
        for (;;) {
          const propKey = reader.readVaruint();
          if (propKey === 0) break;
          const backingType = toc.get(propKey) ?? 0;
          skipPropertyValue(reader, backingType);
        }
      }
    }
  } catch (_) {
    // Return partial results if we hit unknown/corrupt data (e.g. list encoding we don't skip)
  }

  return { artboardNames, major, minor };
}

module.exports = { parseRivFile };
