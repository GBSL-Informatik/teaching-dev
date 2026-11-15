import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { renderMath } from '../InlineMath';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const MathBlockPreview = observer(({ handle }: NodeViewProps) => {
    const value = handle.node.textContent;
    const html = React.useMemo(() => renderMath(value, true), [value]);
    return <div className={clsx(styles.preview)} dangerouslySetInnerHTML={{ __html: html }} />;
});

export default MathBlockPreview;
