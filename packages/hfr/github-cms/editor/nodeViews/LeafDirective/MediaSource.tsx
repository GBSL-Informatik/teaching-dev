import { LeafDirectiveName } from '@tdev-plugins/remark-media/mediaElement';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type iFile from '../../../models/iFile';
import Combobox from '../../components/Combobox';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';
import { useAssetPathOptions } from './useAssetPathOptions';

/** the files suggested for directives with a file in the repository, the others are embedded urls */
const ACCEPTED_FILES: Partial<Record<string, (file: iFile) => boolean>> = {
    [LeafDirectiveName.AUDIO]: (file) => file.isAudio,
    [LeafDirectiveName.VIDEO]: (file) => file.isVideo
};

const isDirectory = (path: string) => path.endsWith('/');

/**
 * Edits the source of a media directive, the label of `::audio[./assets/song.mp3]`.
 * Relative paths of audio and video files are completed.
 * It is updated on enter or when leaving the field: every update loads the preview,
 * which must not happen for each typed character.
 */
const MediaSource = observer(({ handle }: NodeViewProps) => {
    const { name, label } = handle.node.attrs;
    const [text, setText] = React.useState<string>(label);
    const options = useAssetPathOptions(text, ACCEPTED_FILES[name]);

    React.useEffect(() => {
        setText(label);
    }, [label]);

    const handleApply = (typed: string = text) => {
        const src = typed.trim();
        if (src !== label) {
            handle.updateAttrs({ label: src });
        }
    };

    // selects the directive, so its settings are shown while the source is edited
    const handleFocus = () => {
        if (!handle.containsSelection()) {
            handle.select();
        }
    };

    const handleSelect = (path: string) => {
        setText(path);
        if (!isDirectory(path)) {
            handleApply(path);
        }
    };

    return (
        <Combobox
            value={text}
            options={options}
            keepsOpen={isDirectory}
            placeholder="Quelle"
            className={clsx(styles.source)}
            onChange={setText}
            onSelect={handleSelect}
            onFocus={handleFocus}
            onEnter={() => handleApply()}
            onBlur={() => handleApply()}
        />
    );
});

export default MediaSource;
