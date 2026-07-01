import siteConfig from '@generated/docusaurus.config';
import type { VersionOptions } from '@docusaurus/plugin-content-docs';

export interface Klass {
    label: string;
    uri: string;
}
export interface Course {
    title: string;
    classes: (string | Klass)[];
}

const classicPreset =
    (
        siteConfig.presets?.find((p) => Array.isArray(p) && p[0] === 'classic') as [
            string,
            Partial<{ docs: { versions: Record<string, VersionOptions> } }>
        ]
    )?.[1] ?? {};
const versions = Object.keys((classicPreset.docs?.versions as Record<string, unknown> | undefined) ?? {});
const validClasses = versions.filter((v) => v.length === 4 && /^\d{2}([A-Z][a-z]|[a-z][A-Z])$/.test(v));
validClasses.sort();

export const useClassVersions = () => {
    const isHS = new Date().getMonth() + 1 >= 7 && new Date().getDate() >= 12;
    const gym1Year = `${new Date().getFullYear() + (isHS ? 4 : 3)}`.slice(2, 4);
    const gym1Next = `${parseInt(gym1Year) + 1}`;
    const gym2Year = `${parseInt(gym1Year) - 1}`;
    const gym1NextClasses = validClasses.filter((v) => /G|m/.test(v.charAt(2)) && v.startsWith(gym1Next));
    const gym1Classes = validClasses.filter((v) => /G|m/.test(v.charAt(2)) && v.startsWith(gym1Year));
    const gym2Classes = validClasses.filter((v) => /G|m/.test(v.charAt(2)) && v.startsWith(gym2Year));
    const fms1NextClasses = validClasses.filter((v) => /F/.test(v.charAt(2)) && v.startsWith(gym1Next));
    const fms1Classes = validClasses.filter((v) => /F/.test(v.charAt(2)) && v.startsWith(gym2Year));
    const courseList: Course[] = [];
    if (gym1NextClasses.length > 0) {
        courseList.push({
            title: 'Gym 1 (Neu)',
            classes: gym1NextClasses
        });
    }
    if (gym1Classes.length > 0) {
        courseList.push({
            title: 'Gym 1',
            classes: gym1Classes
        });
    }
    if (gym2Classes.length > 0) {
        courseList.push({
            title: 'Gym 2',
            classes: gym2Classes
        });
    }
    if (fms1NextClasses.length > 0) {
        courseList.push({
            title: 'FMS (Neu)',
            classes: fms1NextClasses
        });
    }
    if (fms1Classes.length > 0) {
        courseList.push({
            title: 'FMS',
            classes: fms1Classes
        });
    }
    return {
        classes: validClasses,
        courseList: courseList
    };
};
