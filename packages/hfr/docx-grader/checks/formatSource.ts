import { isSameValue, mismatches, PropertyDescriptors } from './properties';

/**
 * Where expected formatting may come from: `style` requires the paragraph or character style to
 * give it, `any` also accepts direct formatting.
 */
export type FormatSource = 'style' | 'any';

/**
 * Splits expected properties by where the original got them from: those its styles give in every
 * part (`style`), and the directly formatted ones (`any`). Empty parts are left out.
 */
export const splitBySource = <T extends object>(
    expect: Partial<T>,
    styleFormats: T[]
): { source: FormatSource; expect: Partial<T> }[] => {
    const keys = Object.keys(expect) as (keyof T)[];
    const fromStyle = keys.filter((key) =>
        styleFormats.every((format) => isSameValue(format[key], expect[key]))
    );
    const direct = keys.filter((key) => !fromStyle.includes(key));
    const pick = (picked: (keyof T)[]) =>
        Object.fromEntries(picked.map((key) => [key, expect[key]])) as Partial<T>;
    return [
        ...(fromStyle.length > 0 ? [{ source: 'style' as const, expect: pick(fromStyle) }] : []),
        ...(direct.length > 0 ? [{ source: 'any' as const, expect: pick(direct) }] : [])
    ];
};

/**
 * Mismatches of the effective format and, when the source is `style`, the expected properties
 * that are only right because of direct formatting.
 */
export const sourceMismatches = <T extends object>(
    expect: Partial<T>,
    actual: { format: T; styleFormat: T },
    source: FormatSource,
    descriptors: PropertyDescriptors<T>,
    styleLabel: string
): string[] => {
    const failures = mismatches(expect, actual.format, descriptors);
    if (source !== 'style') {
        return failures;
    }
    const keys = Object.keys(expect) as (keyof T)[];
    const directlyFormatted = keys.filter(
        (key) =>
            isSameValue(actual.format[key], expect[key]) && !isSameValue(actual.styleFormat[key], expect[key])
    );
    return [
        ...failures,
        ...directlyFormatted.map((key) => {
            const { label, format } = descriptors[key];
            return `${label}: ${format(expect[key] as T[keyof T])} ist direkt formatiert statt über ${styleLabel}`;
        })
    ];
};
