import { describe, expect, it } from 'vitest';
import { diffPackages } from '../dependencyCheck';

describe('diffPackages', () => {
    it('returns empty on empty input', () => {
        const result = diffPackages({}, {});
        expect(result).toEqual({
            upgradeable: [],
            downgradeable: [],
            installable: []
        });
    });
    it('returns empty on equal input', () => {
        const result = diffPackages({ pkg1: '1.0.0' }, { pkg1: '1.0.0' });
        expect(result).toEqual({
            upgradeable: [],
            downgradeable: [],
            installable: []
        });
    });
    it('returns installable on new input', () => {
        const result = diffPackages({}, { pkg1: '1.0.0' });
        expect(result).toEqual({
            upgradeable: [],
            downgradeable: [],
            installable: [
                {
                    packageName: 'pkg1',
                    version: '1.0.0'
                }
            ]
        });
    });
    it('returns upgradeable on higher version', () => {
        const result = diffPackages({ pkg1: '1.0.0' }, { pkg1: '1.1.0' });
        expect(result).toEqual({
            upgradeable: [
                {
                    packageName: 'pkg1',
                    from: '1.0.0',
                    to: '1.1.0'
                }
            ],
            downgradeable: [],
            installable: []
        });
    });
    it('returns upgradeable when minor version jumps over ten', () => {
        const result = diffPackages({ pkg1: '1.9.0' }, { pkg1: '1.10.0' });
        expect(result).toEqual({
            upgradeable: [
                {
                    packageName: 'pkg1',
                    from: '1.9.0',
                    to: '1.10.0'
                }
            ],
            downgradeable: [],
            installable: []
        });
    });
    it('returns upgradeable when minor version jumps over ten and has range', () => {
        const result = diffPackages({ pkg1: '^1.9.0' }, { pkg1: '^1.10.0' });
        expect(result).toEqual({
            upgradeable: [
                {
                    packageName: 'pkg1',
                    from: '^1.9.0',
                    to: '^1.10.0'
                }
            ],
            downgradeable: [],
            installable: []
        });
    });
    it('returns downgradeable on lower version', () => {
        const result = diffPackages({ pkg1: '1.1.0' }, { pkg1: '1.0.0' });
        expect(result).toEqual({
            upgradeable: [],
            downgradeable: [
                {
                    packageName: 'pkg1',
                    from: '1.1.0',
                    to: '1.0.0'
                }
            ],
            installable: []
        });
    });
});
