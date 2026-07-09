/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { JSX } from 'react';

import styles from './styles.module.scss';

import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import React, { useRef } from 'react';
import clsx from 'clsx';
import { contentEditableRef$, useCellValue } from '@mdxeditor/editor';
import Icon from '@mdi/react';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = styles.draggableBlockMenu;
const PATH =
    'M8.5 10a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm0 7a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm7-10a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-7-4a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm7 14a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm0-7a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z' as const;

function isOnMenu(element: HTMLElement): boolean {
    return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}
interface Props {
    isNested?: boolean;
}
const DraggableBlockNode = (props: Props): JSX.Element => {
    const isNested = !!props.isNested;
    const anchorElem = useCellValue(contentEditableRef$);
    const menuRef = useRef<HTMLDivElement>(null);
    const targetLineRef = useRef<HTMLDivElement>(null);
    return (
        <DraggableBlockPlugin_EXPERIMENTAL
            anchorElem={anchorElem?.current}
            menuRef={menuRef as React.RefObject<HTMLDivElement>}
            targetLineRef={targetLineRef as React.RefObject<HTMLDivElement>}
            menuComponent={
                <div ref={menuRef} className={clsx(styles.icon, DRAGGABLE_BLOCK_MENU_CLASSNAME)}>
                    <div className={clsx(styles.icon)}>
                        <Icon path={PATH} size={0.7} />
                    </div>
                </div>
            }
            targetLineComponent={
                <div ref={targetLineRef} className={clsx(styles.draggableBlockTargetLine)} />
            }
            isOnMenu={isOnMenu}
        />
    );
};

export default DraggableBlockNode;
