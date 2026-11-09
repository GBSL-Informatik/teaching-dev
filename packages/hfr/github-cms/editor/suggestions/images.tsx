import { mdiFolderImage, mdiImageOutline } from '@mdi/js';
import { insertInline } from '../commands';
import RepoImagePreview from '../components/RepoImagePreview';
import type MdxDocument from '../models/MdxDocument';
import { schema } from '../schema';
import { fuzzyFilter } from './fuzzyScore';
import type { Suggestion, SuggestionSource } from './types';

const otherImage = (document: MdxDocument): Suggestion => ({
    label: 'Anderes Bild...',
    icon: mdiFolderImage,
    command: (_state, dispatch) => {
        if (dispatch) {
            document.setImageDialogOpen(true);
        }
        return true;
    }
});

/**
 * `![`, the markdown syntax of an image: the images in `./images` next to the file,
 * and a dialog to upload or choose another image.
 */
export const imageSource = (document: MdxDocument): SuggestionSource => ({
    pattern: /(?<=^|\s)!\[([^\]\s]{0,40})$/,
    suggestions: (_state, query) => {
        const { file } = document;
        const images = fuzzyFilter(file.images, query, (image) => [image.name]);
        const suggestions = images.map((image): Suggestion => ({
            label: image.name,
            icon: mdiImageOutline,
            preview: <RepoImagePreview image={image} />,
            command: insertInline(schema.nodes.image.create({ src: file.relativePath(image) }))
        }));
        return [...suggestions, otherImage(document)];
    }
});
