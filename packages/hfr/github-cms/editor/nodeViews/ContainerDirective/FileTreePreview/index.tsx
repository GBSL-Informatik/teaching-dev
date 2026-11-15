import Dir from '@tdev-components/FileSystem/Dir';
import { useComputed } from '@tdev-hooks/useComputed';
import { transformAttributes } from '@tdev-plugins/helpers';
import { rootDir } from '@tdev-plugins/remark-file-trees/rootDir';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import React from 'react';
import type { NodeViewProps } from '../../ReactNodeView';
import { fileTreeItems } from '../fileTree';
import styles from './styles.module.scss';

/** the props of `<Dir>` set by the attributes, see `remark-file-trees` */
const dirProps = (directive: Node) => {
    const { openLevel, maxHeight } = transformAttributes(directive.attrs.attributes, {}).attributes;
    return {
        open: typeof openLevel === 'number' ? openLevel : true,
        maxHeight: maxHeight === undefined ? undefined : String(maxHeight)
    };
};

/**
 * `:::tree` is shown as on the page, in place of its list. The list is edited while the
 * cursor is in the directive, clicking on the tree moves the cursor into the list.
 * An invalid list is always shown, the page would fail to build.
 */
const FileTreePreview = observer(({ handle }: NodeViewProps) => {
    const isEditing = useComputed(() => handle.containsSelection(), [handle]);
    const items = isEditing ? null : fileTreeItems(handle.node);
    const showsPreview = items !== null;

    React.useEffect(() => {
        handle.setContentHidden(showsPreview);
    }, [handle, showsPreview]);
    React.useEffect(() => () => handle.setContentHidden(false), [handle]);

    if (!items) {
        return null;
    }
    return (
        // the clicks are handled here, ProseMirror must not select the node
        <div className={clsx(styles.preview)} onClick={() => handle.focusChild(0)} data-stop-event>
            <Dir dir={rootDir(items)} {...dirProps(handle.node)} noSelect />
        </div>
    );
});

export default FileTreePreview;
