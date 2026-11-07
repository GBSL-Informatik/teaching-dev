import * as MdiIcons from '@mdi/js';

export interface MdiIcon {
    /** the name used in markdown, e.g. `keyboard-return` for `:mdi[keyboard-return]` */
    name: string;
    path: string;
}

const MAX_RESULTS = 60;

/**
 * `mdiBattery10Bluetooth` -> `battery-10-bluetooth`, `mdiAlphaABox` -> `alpha-a-box`.
 * The inverse of `mdiPath`, which is how `remark-mdi` resolves the names.
 */
export const toIconName = (exportName: string) => {
    return exportName
        .slice('mdi'.length)
        .replace(/([a-z0-9])(?=[A-Z])/g, '$1-')
        .replace(/([A-Z])(?=[A-Z])/g, '$1-')
        .replace(/([a-zA-Z])(?=\d)/g, '$1-')
        .toLowerCase();
};

let allIcons: MdiIcon[] | undefined;

const icons = (): MdiIcon[] => {
    if (!allIcons) {
        allIcons = Object.entries(MdiIcons as Record<string, string>).map(([exportName, path]) => ({
            name: toIconName(exportName),
            path
        }));
    }
    return allIcons;
};

/** `keyboard-return` -> `mdiKeyboardReturn`, the same way `remark-mdi` resolves the names */
export const toExportName = (name: string) => {
    const pascalCase = name
        .trim()
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    return `mdi${pascalCase}`;
};

export const mdiPath = (name: string): string | undefined => {
    return (MdiIcons as Record<string, string>)[toExportName(name)];
};

/**
 * Icons whose name contains the query: the exact match first, then icons starting with the query.
 */
export const searchIcons = (query: string): MdiIcon[] => {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, '-');
    if (!normalized) {
        return icons().slice(0, MAX_RESULTS);
    }
    const matches = icons().filter((icon) => icon.name.includes(normalized));
    const exact = matches.filter((icon) => icon.name === normalized);
    const startsWith = matches.filter((icon) => icon.name !== normalized && icon.name.startsWith(normalized));
    const contains = matches.filter((icon) => !icon.name.startsWith(normalized));
    return [...exact, ...startsWith, ...contains].slice(0, MAX_RESULTS);
};
