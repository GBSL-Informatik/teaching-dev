import { FileTreeIcons } from '@pierre/trees';
import DocumentStore from '@tdev-stores/DocumentStore';

export const createIconSet = (documentStore: DocumentStore): FileTreeIcons => {
    const extensions: Record<string, string> = {};
    const iconMap = [...documentStore.fileExtensions.keys()]
        .map((type) => {
            const config = documentStore.fileExtensions.get(type)!;
            if (!config.icon) {
                return;
            }
            extensions[config.extension.replace(/^\./, '')] = type;
            return `
            <symbol id="${type}" viewBox="0 0 24 24">
                <path d="${config.icon}" style="${config.iconColor ? `fill: ${config.iconColor}` : ''}" />
            </symbol>`;
        })
        .filter((ico) => ico !== undefined)
        .join('\n');
    const spriteSheet = `
        <svg aria-hidden="true" width="0" height="0">
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
