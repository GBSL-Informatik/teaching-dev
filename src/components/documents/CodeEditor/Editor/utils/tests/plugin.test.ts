import { describe, expect, it } from 'vitest';

const process = async (content: string) => {
    const { default: svg2Grbl } = (await import('../svg2grbl')) as any;

    const result = svg2Grbl(content);

    return result;
};

describe('#svg2grbl', () => {
    it('performs initialization on empty SVG', async () => {
        const input = `<svg></svg>`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "G90
          G21
          G1 F1000
          M3 S1000
          G4 P0.1
          G90
          $H
          G92 X0 Y0 Z0
          $32=1
          G90
          G91 X85 Y85 F4000
          G4 P0"
        `);
    });

    it('draws a doublerectangle', async () => {
        const input = `<svg width="160" height="85" xmlns="http://www.w3.org/2000/svg" viewBox="245,170,160,85">
                            <g transform="translate(250 250)">
                                <line x1="0" y1="0" x2="0" y2="0" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="0" y1="0" x2="100" y2="0" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="100" y1="0" x2="100" y2="-50" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="100" y1="-50" x2="0" y2="-50.000000000000014" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="0" y1="-50.000000000000014" x2="-9.184850993605149e-15" y2="-1.4210854715202004e-14" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="-9.184850993605149e-15" y1="-1.4210854715202004e-14" x2="50" y2="-1.4210854715202004e-14" opacity="0" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="50" y1="-25" x2="150" y2="-24.999999999999975" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="150" y1="-24.999999999999975" x2="150.00000000000003" y2="-74.99999999999997" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="150.00000000000003" y1="-74.99999999999997" x2="50.00000000000003" y2="-75.00000000000001" style="stroke: black; stroke-width: 1;"></line>
                                <line x1="50.00000000000003" y1="-75.00000000000001" x2="50.00000000000001" y2="-25.000000000000014" style="stroke: black; stroke-width: 1;"></line>
                            </g>
                        </svg>`;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "G90
          G21
          G1 F1000
          M3 S1000
          G4 P0.1
          G90
          $H
          G92 X0 Y0 Z0
          $32=1
          G90
          G91 X85 Y85 F4000
          M3 S100
          G4 P0.1
          G90
          G1 X119 Y85 F3000
          G1 X119 Y68 F3000
          G1 X85 Y68 F3000
          G1 X85 Y85 F3000
          M3 S1000
          G4 P0.1
          G90
          G0 X102 Y76.5
          M3 S100
          G4 P0.1
          G90
          G1 X136 Y76.5 F3000
          G1 X136 Y59.5 F3000
          G1 X102 Y59.5 F3000
          G1 X102 Y76.5 F3000
          M3 S1000
          G4 P0.1
          G90
          G4 P0"
        `);
    });
});
