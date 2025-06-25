import { Node, visit, Visitor } from '..';
import { default as extractText } from './text';

interface LanguagePart {
    lang: string;
    text: string;
}

const getLang = (rPr: Node | string) => {
    if (typeof rPr === 'string' || typeof rPr['w:lang'] !== 'object') {
        return undefined;
    }
    if (Array.isArray(rPr['w:lang']) || typeof rPr['w:lang'].attributes !== 'object') {
        return undefined;
    }
    return rPr['w:lang'].attributes['w:val'];
};

const extractor = (node: Node) => {
    const languageParts: LanguagePart[] = [];
    visit(
        node,
        (name, node) => {
            return name === 'w:rPr' && getLang(node) !== undefined;
        },
        (name, rPr, index, parent) => {
            const lang = getLang(rPr);
            if (typeof lang === 'string') {
                const text = parent ? extractText(parent.node) : '';
                languageParts.push({ lang, text });
            }
            return 'continue';
        }
    );
    return languageParts;
};

export default extractor;
