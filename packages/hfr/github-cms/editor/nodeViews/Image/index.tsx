import { mdiCog, mdiImageEditOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { useAssetFile } from '../../../components/MdxEditor/hooks/useAssetFile';
import ImageDialog from '../../components/ImageDialog';
import InlinePopover from '../../components/InlinePopover';
import type { NodeViewProps } from '../ReactNodeView';
import { cssWidth, splitAlt, widthOption, withWidthOption } from './altText';
import Caption from './Caption';
import ExcalidrawButton from './ExcalidrawButton';
import ImageOptions from './ImageOptions';
import ImageSource from './ImageSource';
import ResizeHandles from './ResizeHandles';
import styles from './styles.module.scss';

const Image = observer(({ handle }: NodeViewProps) => {
    const { src, alt } = handle.node.attrs;
    const [showDialog, setShowDialog] = React.useState(false);
    const asset = useAssetFile(src);
    const resolvedSrc = asset?.type === 'bin_file' ? asset.src : src;
    const { caption } = splitAlt(alt);

    const [frame, setFrame] = React.useState<HTMLSpanElement | null>(null);
    /** the width while the image is resized, it is written to the alt text when done */
    const [resizeWidth, setResizeWidth] = React.useState<number | null>(null);
    const altWidth = widthOption(alt);
    const width = resizeWidth === null ? altWidth && cssWidth(altWidth) : `${resizeWidth}px`;

    const handleResizeEnd = (newWidth: number) => {
        setResizeWidth(null);
        handle.updateAttrs({ alt: withWidthOption(handle.node.attrs.alt, `${newWidth}px`) });
    };

    return (
        <>
            <span
                className={clsx(styles.figure, handle.selected && styles.selected, width && styles.sized)}
                style={width ? { width } : undefined}
            >
                <span ref={setFrame} className={clsx(styles.frame)}>
                    <img src={resolvedSrc} alt={caption} className={clsx(styles.image)} />
                    <ResizeHandles target={frame} onResize={setResizeWidth} onResizeEnd={handleResizeEnd} />
                    <span className={clsx(styles.settings)}>
                        {asset?.type === 'bin_file' && <ExcalidrawButton handle={handle} image={asset} />}
                        <InlinePopover
                            onClose={() => handle.selectAndFocus()}
                            title="Bild"
                            trigger={<Button icon={mdiCog} size={SIZE_S} title="Bild bearbeiten" />}
                        >
                            <ImageSource handle={handle} />
                            <ImageOptions handle={handle} />
                            <Button
                                icon={mdiImageEditOutline}
                                text="Bild ändern"
                                iconSide="left"
                                onClick={() => setShowDialog(true)}
                            />
                        </InlinePopover>
                    </span>
                </span>
                <Caption handle={handle} />
            </span>
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
