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
    it('respects controls=false for video', async () => {
        const input = `
            ::video[./bunny.mp4]{controls=false}
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<video style={{"maxWidth":"100%"}}>
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
          "<div style={{"width":"100%","aspectRatio":"16 / 9"}}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe" title="YouTube video player" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
          "
        `);
    });
    it('can convert youtube directive with opitions', async () => {
        const input = `
            ::youtube[https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe]{width=200px height=100px}
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<div style={{"marginLeft":"auto","marginRight":"auto","maxWidth":"100%","width":"200px","minWidth":"200px","height":"100px"}}>
            <iframe width="200px" height="100px" src="https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe" title="YouTube video player" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
          "
        `);
    });
    it('can convert circuitverse directive', async () => {
        const input = `
            ::circuitverse[https://circuitverse.org/simulator/embed/rothe-inverter]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<iframe height="315px" src="https://circuitverse.org/simulator/embed/rothe-inverter" title="Circuit Verse" frameBorder="0" scrolling="no" allowFullScreen style={{"width":"100%","maxWidth":"100%"}} />
          "
        `);
    });
    it('can convert codepen directive', async () => {
        const input = `
            ::codepen[https://codepen.io/lebalz/pen/PwYoOBK]
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<iframe height="500px" src="https://codepen.io/lebalz/embed/PwYoOBK?editable=true" title="Codepen" scrolling="no" frameBorder="no" loading="lazy" allowTransparency allowFullScreen style={{"width":"100%","maxWidth":"100%"}} />
          "
        `);
    });
    it('can convert codepen directive with attributes', async () => {
        const input = `
            ::codepen[https://codepen.io/lebalz/pen/PwYoOBK]{theme=dark editable=false defaultTab=css,result width=920px height=500}
        `;
        const result = await process(input);
        expect(result).toMatchInlineSnapshot(`
          "<iframe height="500" src="https://codepen.io/lebalz/embed/PwYoOBK?theme-id=dark&default-tab=css%2Cresult" title="Codepen" scrolling="no" frameBorder="no" loading="lazy" allowTransparency allowFullScreen style={{"width":"920px","maxWidth":"100%","minWidth":"920px","height":"500"}} />
          "
        `);
    });
});
