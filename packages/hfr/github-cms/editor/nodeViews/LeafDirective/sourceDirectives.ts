import { isMediaDirective, LeafDirectiveName } from '@tdev-plugins/remark-media/mediaElement';
import type iFile from '../../../models/iFile';

/** `::pdf[./assets/file.pdf]` of `remark-pdf` */
const PDF_DIRECTIVE = 'pdf';

/** directives whose label is the source of a file or an embed, e.g. `::audio[./assets/song.mp3]` */
export const hasSourceLabel = (name: string) => isMediaDirective(name) || name === PDF_DIRECTIVE;

/** the files suggested for directives with a file in the repository, the others are embedded urls */
export const ACCEPTED_FILES: Partial<Record<string, (file: iFile) => boolean>> = {
    [LeafDirectiveName.AUDIO]: (file) => file.isAudio,
    [LeafDirectiveName.VIDEO]: (file) => file.isVideo,
    [PDF_DIRECTIVE]: (file) => file.isPdf
};
