/** Minimal WebUSB surface used by the FT232R cable shipped with K-LD7-EVAL. */
export interface UsbEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: string;
    packetSize: number;
}
export interface UsbDevice {
    productName?: string;
    configuration: {
        interfaces: {
            interfaceNumber: number;
            alternates: { alternateSetting: number; endpoints: UsbEndpoint[] }[];
        }[];
    } | null;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(value: number): Promise<void>;
    claimInterface(value: number): Promise<void>;
    selectAlternateInterface(iface: number, alternate: number): Promise<void>;
    controlTransferOut(setup: {
        requestType: 'vendor';
        recipient: 'device';
        request: number;
        value: number;
        index: number;
    }): Promise<{ status: string }>;
    transferIn(endpoint: number, length: number): Promise<{ status: string; data?: DataView }>;
    transferOut(endpoint: number, data: Uint8Array): Promise<{ status: string; bytesWritten: number }>;
}
export interface WebUsb {
    requestDevice(options: { filters: { vendorId: number; productId: number }[] }): Promise<UsbDevice>;
}

export const getWebUsb = (): WebUsb | undefined => {
    return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { usb?: WebUsb }).usb;
};

/** FTDI prefixes every USB packet (including empty packets) with two status bytes. */
export const stripFtdiStatus = (data: Uint8Array, packetSize: number): Uint8Array => {
    const parts: Uint8Array[] = [];
    for (let offset = 0; offset < data.length; offset += packetSize) {
        const packet = data.subarray(offset, Math.min(offset + packetSize, data.length));
        if (packet.length < 2) {
            throw new Error('Unvollständiges FTDI-Statuspaket.');
        }
        if (packet[1] & 0x1e) {
            throw new Error('UART-Fehler (Überlauf, Parität oder Framing).');
        }
        parts.push(packet.subarray(2));
    }
    const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    parts.forEach((part) => {
        result.set(part, offset);
        offset += part.length;
    });
    return result;
};

export interface RadarTransport {
    open(): Promise<void>;
    read(): Promise<Uint8Array>;
    write(bytes: Uint8Array): Promise<void>;
    close(): Promise<void>;
}

export default class FtdiTransport implements RadarTransport {
    private input?: UsbEndpoint;
    private output?: UsbEndpoint;
    private iface = 0;

    constructor(private device: UsbDevice) {}

    private async control(request: number, value: number): Promise<void> {
        const result = await this.device.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request,
            value,
            index: this.iface + 1
        });
        if (result.status !== 'ok') {
            throw new Error('FTDI-Konfiguration fehlgeschlagen.');
        }
    }

    async open(): Promise<void> {
        try {
            await this.device.open();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (
                /access denied/i.test(message) ||
                (error instanceof DOMException && error.name === 'SecurityError')
            ) {
                throw new Error(
                    'WebUSB-Zugriff verweigert. Hersteller-Software schliessen und USB-Berechtigungen prüfen. Unter Windows benötigt WebUSB WinUSB statt des FTDI-COM-Treibers. Mit dem bestehenden COM-Treiber alternativ «Seriell verbinden» verwenden.'
                );
            }
            throw error;
        }
        if (!this.device.configuration) {
            await this.device.selectConfiguration(1);
        }
        const iface = this.device.configuration?.interfaces.find((entry) =>
            entry.alternates.some(
                (alternate) =>
                    alternate.endpoints.some(
                        (endpoint) => endpoint.type === 'bulk' && endpoint.direction === 'in'
                    ) &&
                    alternate.endpoints.some(
                        (endpoint) => endpoint.type === 'bulk' && endpoint.direction === 'out'
                    )
            )
        );
        const alternate = iface?.alternates.find(
            (entry) =>
                entry.endpoints.some((endpoint) => endpoint.direction === 'in' && endpoint.type === 'bulk') &&
                entry.endpoints.some((endpoint) => endpoint.direction === 'out' && endpoint.type === 'bulk')
        );
        if (!iface || !alternate) {
            throw new Error('Keine FTDI-Bulk-Schnittstelle gefunden.');
        }
        this.iface = iface.interfaceNumber;
        this.input = alternate.endpoints.find((entry) => entry.type === 'bulk' && entry.direction === 'in');
        this.output = alternate.endpoints.find((entry) => entry.type === 'bulk' && entry.direction === 'out');
        await this.device.claimInterface(this.iface);
        await this.device.selectAlternateInterface(this.iface, alternate.alternateSetting);
        await this.control(0, 0); // SIO reset
        await this.control(3, 0x001a); // FT232R: 3 MHz / 26 = 115384 baud (115200 nominal)
        await this.control(4, 0x0208); // 8 data bits, even parity, one stop bit
        await this.control(9, 2); // 2 ms latency timer
        await this.control(0, 1); // purge RX
        await this.control(0, 2); // purge TX
    }

    async read(): Promise<Uint8Array> {
        if (!this.input) {
            throw new Error('USB ist nicht verbunden.');
        }
        const result = await this.device.transferIn(this.input.endpointNumber, this.input.packetSize * 16);
        if (result.status !== 'ok' || !result.data) {
            throw new Error('USB-Lesen fehlgeschlagen.');
        }
        return stripFtdiStatus(
            new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength),
            this.input.packetSize
        );
    }

    async write(bytes: Uint8Array): Promise<void> {
        if (!this.output) {
            throw new Error('USB ist nicht verbunden.');
        }
        const result = await this.device.transferOut(this.output.endpointNumber, bytes);
        if (result.status !== 'ok' || result.bytesWritten !== bytes.length) {
            throw new Error('USB-Schreiben fehlgeschlagen.');
        }
    }

    async close(): Promise<void> {
        this.input = undefined;
        this.output = undefined;
        await this.device.close(); // also cancels a pending transferIn
    }
}
