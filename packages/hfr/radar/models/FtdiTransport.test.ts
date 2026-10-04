import { describe, expect, it, vi } from 'vitest';
import FtdiTransport, { type UsbDevice } from './FtdiTransport';

describe('FT232R transport', () => {
    it('explains access-denied errors and offers the existing COM driver alternative', async () => {
        const device = {
            open: vi
                .fn()
                .mockRejectedValue(
                    new DOMException(
                        "Failed to execute 'open' on 'USBDevice': Access denied.",
                        'NetworkError'
                    )
                )
        } as unknown as UsbDevice;
        await expect(new FtdiTransport(device).open()).rejects.toThrow('Seriell verbinden');
    });
    it('claims the bulk interface and configures 115200 8E1 before transferring bytes', async () => {
        const controls: { request: number; value: number; index: number }[] = [];
        const device: UsbDevice = {
            configuration: {
                interfaces: [
                    {
                        interfaceNumber: 0,
                        alternates: [
                            {
                                alternateSetting: 0,
                                endpoints: [
                                    { endpointNumber: 1, direction: 'in', type: 'bulk', packetSize: 64 },
                                    { endpointNumber: 2, direction: 'out', type: 'bulk', packetSize: 64 }
                                ]
                            }
                        ]
                    }
                ]
            },
            open: vi.fn(async () => {}),
            close: vi.fn(async () => {}),
            selectConfiguration: vi.fn(async () => {}),
            claimInterface: vi.fn(async () => {}),
            selectAlternateInterface: vi.fn(async () => {}),
            controlTransferOut: vi.fn(async (setup) => {
                controls.push(setup);
                return { status: 'ok' };
            }),
            transferIn: vi.fn(async () => ({
                status: 'ok',
                data: new DataView(new Uint8Array([1, 0x60, 80, 68]).buffer)
            })),
            transferOut: vi.fn(async (_endpoint, bytes) => ({ status: 'ok', bytesWritten: bytes.length }))
        };
        const transport = new FtdiTransport(device);
        await transport.open();
        expect(device.claimInterface).toHaveBeenCalledWith(0);
        expect(controls.map(({ request, value }) => [request, value])).toEqual([
            [0, 0],
            [3, 26],
            [4, 0x0208],
            [9, 2],
            [0, 1],
            [0, 2]
        ]);
        expect([...(await transport.read())]).toEqual([80, 68]);
        await transport.write(new Uint8Array([1, 2]));
        expect(device.transferOut).toHaveBeenCalledWith(2, new Uint8Array([1, 2]));
        await transport.close();
        expect(device.close).toHaveBeenCalled();
    });
});
