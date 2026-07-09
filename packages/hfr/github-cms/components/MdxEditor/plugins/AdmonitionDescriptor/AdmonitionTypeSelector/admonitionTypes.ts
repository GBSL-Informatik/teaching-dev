import siteConfig from '@generated/docusaurus.config';
import _ from 'es-toolkit/compat';
import type * as Preset from '@docusaurus/preset-classic';

const { organizationName, projectName, presets } = siteConfig;
if (!organizationName || !projectName) {
    throw new Error('"organizationName" and "projectName" must be set in docusaurus.config.ts');
}
const admonitions = ['note', 'tip', 'info', 'warning', 'danger'];
const classicPreset = presets.find((p) => Array.isArray(p) && p[0] === 'classic') as [
    'classic',
    Preset.Options
];
if (classicPreset) {
    if (typeof classicPreset[1].docs === 'object') {
        const presetAdmonitions = classicPreset[1].docs.admonitions;
        if (typeof presetAdmonitions === 'object') {
            if (presetAdmonitions.extendDefaults) {
                admonitions.push(...(presetAdmonitions.keywords || []));
            } else {
                admonitions.splice(0, admonitions.length, ...(presetAdmonitions.keywords || []));
            }
        }
    }
}

export const ADMONITION_TYPES = [...admonitions] as const;
