import { mdiCircleMedium, mdiRecordCircleOutline } from '@mdi/js';
import { FileTreeIcons } from '@pierre/trees';
import type DocumentStore from '@tdev-stores/DocumentStore';

export const createIconSet = (documentStore: DocumentStore): FileTreeIcons => {
    const extensions: Record<string, string> = {};
    const icons: string[] = [];
    for (const config of documentStore.registeredFileExtensions) {
        if (!config.icon) {
            continue;
        }
        const ext = config.extension.replace(/^\./, '');
        extensions[ext] = ext;
        icons.push(`
            <symbol id="${ext}" viewBox="0 0 24 24">
                <path d="${config.icon}" fill="${config.iconColor || 'currentColor'}" />
            </symbol>`);
    }
    icons.push(
        `<symbol id="active-directory" viewBox="0 0 24 24"><path d="${mdiCircleMedium}" fill="var(--ifm-color-info)" /></symbol>`,
        `<symbol id="active-file" viewBox="0 0 24 24"><path d="${mdiRecordCircleOutline}" fill="var(--ifm-color-success)" /></symbol>`
    );
    const spriteSheet = `
        <svg aria-hidden="true" width="0" height="0">
            ${icons.join('\n')}
        </svg>
    `;

    return {
        set: 'none',
        colored: true,
        spriteSheet,
        byFileExtension: extensions
    };
};
