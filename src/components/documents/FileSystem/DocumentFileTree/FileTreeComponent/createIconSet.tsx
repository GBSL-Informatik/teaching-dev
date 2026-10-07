import { mdiCircleMedium, mdiRecordCircleOutline } from '@mdi/js';
import { FileTreeIcons } from '@pierre/trees';
import DocumentStore from '@tdev-stores/DocumentStore';

export const createIconSet = (documentStore: DocumentStore): FileTreeIcons => {
    const extensions: Record<string, string> = {};
    const iconMap = [...documentStore.fileExtensions.keys()]
        .flatMap((type) => {
            const configs = documentStore.fileExtensions.get(type)!;
            return configs.map((config) => {
                if (!config.icon) {
                    return;
                }
                const ext = config.extension.replace(/^\./, '');
                extensions[ext] = ext;
                return `
                <symbol id="${ext}" viewBox="0 0 24 24">
                    <path d="${config.icon}" style="${config.iconColor ? `fill: ${config.iconColor}` : ''}" />
                </symbol>`;
            });
        })
        .filter((ico) => ico !== undefined)
        .join('\n');
    const icons = [
        `<symbol id="active-directory" viewBox="0 0 24 24"><path d="${mdiCircleMedium}" style="fill: #1ca1c7;" /></symbol>`,
        `<symbol id="active-file" viewBox="0 0 24 24"><path d="${mdiRecordCircleOutline}" style="fill: var(--ifm-color-success);" /></symbol>`
    ];
    const spriteSheet = `
        <svg aria-hidden="true" width="0" height="0">
            ${icons.join('\n')}
            ${iconMap}
        </svg>
    `;

    return {
        set: 'none',
        colored: true,
        spriteSheet: spriteSheet,
        byFileExtension: extensions
    };
};
