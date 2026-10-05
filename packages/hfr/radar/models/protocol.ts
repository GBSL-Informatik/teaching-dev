export const DISTANCE_RANGES = [5, 10, 30, 100] as const;
export const SPEED_RANGES = [12.5, 25, 50, 100] as const;

export interface RadarSettings {
    range: number;
    speed: number;
    frequency: number;
    tracking: number;
    sensitivity: number;
}

export const DEFAULT_SETTINGS: RadarSettings = {
    range: 1,
    speed: 1,
    frequency: 1,
    tracking: 0,
    sensitivity: 4
};

export interface RadarTarget {
    distance: number;
    speed: number;
    angle: number;
    magnitude: number;
    x: number;
    y: number;
}

export interface RadarFrame {
    header: string;
    payload: Uint8Array;
}

export const encodeCommand = (header: string, value?: number): Uint8Array => {
    if (!/^[A-Z]{4}$/.test(header)) {
        throw new Error('Ungültiger Radar-Kommandoheader.');
    }
    const bytes = new Uint8Array(value === undefined ? 8 : 12);
    bytes.set(new TextEncoder().encode(header));
    const view = new DataView(bytes.buffer);
    view.setUint32(4, value === undefined ? 0 : 4, true);
    if (value !== undefined) {
        view.setUint32(8, value, true);
    }
    return bytes;
};

/** Serial chunks do not necessarily end at a radar frame boundary. */
export class FrameDecoder {
    private buffer: Uint8Array = new Uint8Array();

    push(chunk: Uint8Array): RadarFrame[] {
        const bytes = new Uint8Array(this.buffer.length + chunk.length);
        bytes.set(this.buffer);
        bytes.set(chunk, this.buffer.length);
        const frames: RadarFrame[] = [];
        let offset = 0;
        while (bytes.length - offset >= 8) {
            const header = new TextDecoder().decode(bytes.subarray(offset, offset + 4));
            const length = new DataView(bytes.buffer).getUint32(offset + 4, true);
            if (
                !['RESP', 'PDAT', 'TDAT', 'DONE', 'RPST', 'RADC', 'RFFT', 'DDAT'].includes(header) ||
                length > 4096
            ) {
                throw new Error('Ungültiger Radar-Datenrahmen. Sensor neu verbinden.');
            }
            if (bytes.length - offset < 8 + length) {
                break;
            }
            frames.push({ header, payload: bytes.slice(offset + 8, offset + 8 + length) });
            offset += 8 + length;
        }
        this.buffer = bytes.slice(offset);
        return frames;
    }
}

export const decodeTargets = (payload: Uint8Array): RadarTarget[] => {
    if (payload.length % 8 !== 0 || payload.length > 96) {
        throw new Error('Ungültige PDAT-Zielliste.');
    }
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    return Array.from({ length: payload.length / 8 }, (_, index) => {
        const offset = index * 8;
        const distance = view.getUint16(offset, true) / 100;
        const speed = view.getInt16(offset + 2, true) / 100;
        const angle = view.getInt16(offset + 4, true) / 100;
        const magnitude = view.getUint16(offset + 6, true) / 100;
        const radians = (angle * Math.PI) / 180;
        return {
            distance,
            speed,
            angle,
            magnitude,
            x: -distance * Math.sin(radians),
            y: distance * Math.cos(radians)
        };
    });
};

export const settingCommands = (settings: RadarSettings): [string, number][] => {
    const entries: [string, number, number][] = [
        ['RBFR', settings.frequency, 2],
        ['RSPI', settings.speed, 3],
        ['RRAI', settings.range, 3],
        ['TRFT', settings.tracking, 2],
        ['MIDS', settings.sensitivity, 9]
    ];
    return entries.map(([command, value, max]) => {
        if (!Number.isInteger(value) || value < 0 || value > max) {
            throw new Error(`Ungültige Einstellung für ${command}.`);
        }
        return [command, value];
    });
};
