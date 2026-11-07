import { mdiImageEditOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { useAssetFile } from '../../../components/MdxEditor/hooks/useAssetFile';
import ImageDialog from '../../components/ImageDialog';
import InlinePopover from '../../components/InlinePopover';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

/** image options like `--width=20em` in the alt text are handled by `remark-images` */
const OPTIONS_REGEX = /(^|\s+)--[\w-]+(=\S+)?/g;

const Image = observer(({ handle }: NodeViewProps) => {
    const { src, alt } = handle.node.attrs;
    const [showDialog, setShowDialog] = React.useState(false);
    const asset = useAssetFile(src);
    const resolvedSrc = asset?.type === 'bin_file' ? asset.src : src;
    const caption = alt.replace(OPTIONS_REGEX, '').trim();
    return (
        <>
            <InlinePopover
                title="Bild"
                trigger={
                    <span className={clsx(styles.figure, handle.selected && styles.selected)}>
                        <img src={resolvedSrc} alt={caption} className={clsx(styles.image)} />
                        {caption && <span className={clsx(styles.caption)}>{caption}</span>}
                    </span>
                }
            >
                <TextInput
                    label="Bildunterschrift und Optionen (z.B. --width=20em)"
                    value={alt}
                    onChange={(alt) => handle.updateAttrs({ alt })}
                />
                <Button
                    icon={mdiImageEditOutline}
                    text="Bild ändern"
                    iconSide="left"
                    onClick={() => setShowDialog(true)}
                />
            </InlinePopover>
            <Popup
                open={showDialog}
                onClose={() => setShowDialog(false)}
                modal
                nested
                overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            >
                <ImageDialog
                    src={src}
                    onClose={() => setShowDialog(false)}
                    onSelect={(src) => handle.updateAttrs({ src })}
                />
            </Popup>
        </>
    );
});

export default Image;
