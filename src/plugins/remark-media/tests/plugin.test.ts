import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { describe, expect, it } from 'vitest';

const alignLeft = (content: string) => {
    return content
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n');
};
const process = async (content: string) => {
    const { default: plugin } = (await import('../plugin')) as any;
    const result = await remark().use(remarkMdx).use(remarkDirective).use(plugin).process(alignLeft(content));

    return result.value;
};

describe('#medialinks', () => {
    it("does nothing if there's no media", async () => {
        const input = `# Heading

            [hello](https://hello.world)
            `;
        const result = await process(input);
        expect(result).toBe(alignLeft(input));
    });
    it('can convert video directive', async () => {
        const input = `
            ::video[./bunny.mp4]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<video style={{"maxWidth":"100%"}} controls>
            <source src={require('./bunny.mp4').default} />
          </video>
          "
        `);
    });
    it('can convert video with autoplay directive', async () => {
        const input = `
            ::video[./bunny.mp4]{autoplay}
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<video autoPlay playsInline style={{"maxWidth":"100%"}} controls>
            <source src={require('./bunny.mp4').default} />
          </video>
          "
        `);
    });
    it('can convert audio directive', async () => {
        const input = `
            ::audio[./song.mp3]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<audio controls>
            <source src={require('./song.mp3').default} type="audio/mpeg" />
          </audio>
          "
        `);
    });
    it('can convert youtube directive', async () => {
        const input = `
            ::youtube[https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<iframe width="100%" height="315px" src="https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          "
        `);
    });
    it('can convert circuitverse directive', async () => {
        const input = `
            ::circuitverse[https://circuitverse.org/simulator/embed/rothe-inverter]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<iframe width="100%" height="315px" src="https://circuitverse.org/simulator/embed/rothe-inverter" title="Circuit Verse" frameBorder="0" scrolling="no" webkitAllowFullScreen mozAllowFullScreen allowFullScreen />
          "
        `);
    });
});
