import { describe, expect, it } from 'vitest';
import { ParagraphFormatCheck } from '../checks/kinds/paragraphFormat';
import { mergeWithPreviousSpec } from '../cli/specFile';
import { DocxSpec } from '../spec/DocxSpec';

const check: ParagraphFormatCheck = {
    id: 'paragraphFormat-standard-ausrichtung-blocksatz',
    kind: 'paragraphFormat',
    title: '«Standard»: Ausrichtung: Blocksatz',
    anchors: [{ text: 'Hallo' }],
    expect: { alignment: 'justify' }
};

describe('mergeWithPreviousSpec', () => {
    it('keeps the hint, docs and source the teacher added', () => {
        const previous: DocxSpec = {
            version: 1,
            source: 'original.docx',
            checks: [{ ...check, hint: 'Blocksatz!', docs: '/word', source: 'style' }]
        };

        expect(mergeWithPreviousSpec([check], previous)).toEqual([
            { ...check, hint: 'Blocksatz!', docs: '/word', source: 'style' }
        ]);
    });
});
