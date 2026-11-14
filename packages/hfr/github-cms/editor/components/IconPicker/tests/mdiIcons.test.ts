import * as MdiIcons from '@mdi/js';
import { describe, expect, it } from 'vitest';
import { mdiPath, searchIcons, toExportName, toIconName } from '../mdiIcons';

describe('mdi icon names', () => {
    it('converts every icon name back to its export name', () => {
        const broken = Object.keys(MdiIcons).filter(
            (exportName) => toExportName(toIconName(exportName)) !== exportName
        );
        expect(broken).toEqual([]);
    });

    it.each([
        ['mdiKeyboardReturn', 'keyboard-return'],
        ['mdiBattery10Bluetooth', 'battery-10-bluetooth'],
        ['mdiAlphaABox', 'alpha-a-box'],
        ['mdiAxisXYArrowLock', 'axis-x-y-arrow-lock']
    ])('names %s as %s', (exportName, name) => {
        expect(toIconName(exportName)).toBe(name);
    });

    it('resolves names like remark-mdi', () => {
        expect(mdiPath('keyboard-return')).toBe(MdiIcons.mdiKeyboardReturn);
        expect(mdiPath('unknown-icon-name')).toBeUndefined();
    });

    it('lists the exact match first, then icons starting with the query', () => {
        const names = searchIcons('home').map((icon) => icon.name);
        expect(names[0]).toBe('home');
        expect(names[1].startsWith('home')).toBe(true);
        expect(names.every((name) => name.includes('home'))).toBe(true);
    });
});
