import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewProps } from '../ReactNodeView';
import { joinAlt, splitAlt } from './altText';
import { CaptionView } from './CaptionView';
import styles from './styles.module.scss';

/**
 * Edits the caption of an image in place. The caption is the alt text without the image options,
 * which are kept when the caption changes.
 */
const Caption = observer(({ handle }: NodeViewProps) => {
    const { caption } = splitAlt(handle.node.attrs.alt);
    const [mount, setMount] = React.useState<HTMLSpanElement | null>(null);
    const [captionView, setCaptionView] = React.useState<CaptionView | null>(null);

    React.useEffect(() => {
        if (!mount) {
            return;
        }
        const handleChange = (markdown: string) => {
            const { options } = splitAlt(handle.node.attrs.alt);
            handle.updateAttrs({ alt: joinAlt(markdown, options) });
        };
        const view = new CaptionView(
            mount,
            splitAlt(handle.node.attrs.alt).caption,
            handle.editor,
            handleChange
        );
        setCaptionView(view);
        return () => view.destroy();
    }, [mount, handle]);

    React.useEffect(() => {
        captionView?.setMarkdown(caption);
    }, [captionView, caption]);

    return (
        // events are handled by the caption editor, not by the document, see `ReactNodeView.stopEvent`
        <span className={clsx(styles.caption)} data-stop-event>
            {/* prosemirror owns the attributes (e.g. the class) of the element it is mounted on */}
            <span ref={setMount} />
        </span>
    );
});

export default Caption;
