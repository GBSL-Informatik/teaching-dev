import { describe, expect, it } from 'vitest';
import type { JsxAttribute } from '../../schema';
import { parseScoring, scoringAttribute, scoringExpression, withScoring } from '../scoring';

const roundtrip = (expression: string) => {
    const scoring = parseScoring(expression);
    return scoring && scoringExpression(scoring);
};

describe('parseScoring', () => {
    it('fills in the default arguments', () => {
        expect(parseScoring('points(2)')?.args).toEqual([2, 0, 0]);
        expect(parseScoring('multipleChoicePoints(2, 0.5)')?.args).toEqual([2, 0.5, false]);
        expect(parseScoring('noPoints()')?.args).toEqual([]);
    });

    it('reads negative numbers and booleans', () => {
        expect(parseScoring('points(0.5, -0.25, 0)')?.args).toEqual([0.5, -0.25, 0]);
        expect(parseScoring('multipleChoicePoints(2, 1, true)')?.args).toEqual([2, 1, true]);
    });

    it('rejects other expressions', () => {
        expect(parseScoring('myScoring(1)')).toBeNull();
        expect(parseScoring('points(max)')).toBeNull();
        expect(parseScoring('points(1, 2, 3, 4)')).toBeNull();
        expect(parseScoring('points(true)')).toBeNull();
        expect(parseScoring('points(1) + 1')).toBeNull();
    });
});

describe('scoringExpression', () => {
    it('leaves out trailing default arguments', () => {
        expect(roundtrip('points(1, 0, 0)')).toBe('points()');
        expect(roundtrip('points(2, -1, 0)')).toBe('points(2, -1)');
        expect(roundtrip('points(1, 0, -1)')).toBe('points(1, 0, -1)');
    });

    it('keeps the required arguments of multipleChoicePoints', () => {
        expect(roundtrip('multipleChoicePoints(1, 1)')).toBe('multipleChoicePoints(1, 1)');
        expect(roundtrip('multipleChoicePoints(2, 1, false)')).toBe('multipleChoicePoints(2, 1)');
    });
});

describe('scoringAttribute', () => {
    const scoring = (value: string): JsxAttribute[] => [
        { type: 'expressionAttribute', name: 'scoring', value }
    ];

    it('distinguishes no, known and custom scoring', () => {
        expect(scoringAttribute([]).kind).toBe('none');
        expect(scoringAttribute(scoring('points(2)')).kind).toBe('call');
        expect(scoringAttribute(scoring('(doc) => ({})')).kind).toBe('custom');
        expect(scoringAttribute([{ type: 'attribute', name: 'scoring', value: 'x' }]).kind).toBe('custom');
    });

    it('sets the scoring in place and removes it', () => {
        const attributes: JsxAttribute[] = [
            ...scoring('noPoints()'),
            { type: 'attribute', name: 'id', value: '1' }
        ];
        const updated = withScoring(attributes, parseScoring('points(2)'));
        expect(updated).toEqual([...scoring('points(2)'), attributes[1]]);
        expect(withScoring(updated, null)).toEqual([attributes[1]]);
    });
});
