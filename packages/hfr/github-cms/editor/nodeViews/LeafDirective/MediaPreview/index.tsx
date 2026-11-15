import { type LeafDirectiveName, mediaElement } from '@tdev-plugins/remark-media/mediaElement';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useAssetFile } from '../../../../components/MdxEditor/hooks/useAssetFile';
import type { DirectiveAttributes } from '../../../schema';
import MediaElementView from './MediaElementView';
import styles from './styles.module.scss';

interface Props {
    name: LeafDirectiveName;
    src: string;
    attributes: DirectiveAttributes;
}

/** `null` for a source the page would fail to build with, e.g. an invalid url */
const tryMediaElement = (name: LeafDirectiveName, src: string, attributes: DirectiveAttributes) => {
    try {
        return mediaElement(name, src, attributes);
    } catch {
        return null;
    }
};

/**
 * The video, audio or embed of a media directive as the page renders it, see `remark-media`.
 * Relative paths to files (e.g. `::audio[./assets/song.mp3]`) are loaded from the repository.
 */
const MediaPreview = observer(({ name, src, attributes }: Props) => {
    const element = tryMediaElement(name, src, attributes);
    const asset = useAssetFile(src);
    const resolvedSrc = asset?.type === 'bin_file' ? asset.src : src;

    if (!src || !element) {
        return null;
    }
    return (
        // the controls of videos and the embeds handle their events themselves
        <div className={clsx(styles.preview)} data-stop-event>
            {/* a media element does not load a new `<source>`, it is created again instead */}
            <MediaElementView key={resolvedSrc} element={element} resolvedSrc={resolvedSrc} />
        </div>
    );
});

export default MediaPreview;
