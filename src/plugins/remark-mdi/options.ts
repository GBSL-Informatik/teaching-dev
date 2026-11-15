import type { OptionsInput } from './plugin';

/**
 * The options of the mdi plugin in teaching-dev, see `siteConfig/markdownPluginConfigs.ts`.
 * In a module of its own, so that the cms editor renders the icons like the page.
 */
export const MDI_PLUGIN_OPTIONS: OptionsInput = {
    colorMapping: {
        green: 'var(--ifm-color-success)',
        red: 'var(--ifm-color-danger)',
        orange: 'var(--ifm-color-warning)',
        yellow: '#edcb5a',
        blue: '#3578e5',
        cyan: '#01f0bc'
    },
    defaultSize: '1.25em'
};
