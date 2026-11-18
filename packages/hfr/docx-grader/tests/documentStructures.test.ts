import { describe, expect, it } from 'vitest';
import { docModelOf, paragraph, picture } from './createDocx';

const texts = (document: Awaited<ReturnType<typeof docModelOf>>) => {
    return document.paragraphs.map((p) => p.text);
};

describe('document structures', () => {
    it('reads the paragraphs of nested tables once', async () => {
        const nested = `<w:tbl><w:tr><w:tc>${paragraph('inner')}</w:tc></w:tr></w:tbl>`;
        const document = await docModelOf(
            `<w:tbl><w:tr><w:tc>${paragraph('outer')}${nested}${paragraph('after')}</w:tc></w:tr></w:tbl>`
        );

        expect(texts(document)).toEqual(['outer', 'inner', 'after']);
    });

    it('counts a picture inside a text box once', async () => {
        const textBox =
            '<w:r><w:drawing><wp:anchor><wp:extent cx="3600000" cy="360000"/><wp:wrapSquare/>' +
            '<a:graphic><a:graphicData><wps:wsp><wps:txbx><w:txbxContent>' +
            `<w:p>${picture(5)}</w:p>` +
            '</w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>';
        const document = await docModelOf(`<w:p>${textBox}</w:p>`);

        expect(document.images.map((image) => image.widthCm)).toEqual([5]);
    });

    it('keeps the text after a field Word left unterminated', async () => {
        const unterminated =
            '<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText>PAGE</w:instrText></w:r></w:p>';
        const document = await docModelOf(`${unterminated}${paragraph('still visible')}`);

        expect(texts(document)).toEqual(['', 'still visible']);
    });
});
