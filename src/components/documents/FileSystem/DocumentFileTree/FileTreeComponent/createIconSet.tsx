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
