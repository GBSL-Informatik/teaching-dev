import { observer } from 'mobx-react-lite';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import React from 'react';
import CodeBlock, { Props as CodeBlockProps } from '@theme/CodeBlock';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { Props as DefaultCmsProps } from '..';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { useStore } from '@tdev-hooks/useStore';

interface Props extends DefaultCmsProps {
    codeBlockProps?: CodeBlockProps;
}

const CmsCode = observer((props: Props) => {
    const { id, name, showPermissionsPanel } = props;
    const userStore = useStore('userStore');
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const rootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(rootId);
    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return showPermissionsPanel && rootId ? <PermissionsPanel documentRootId={rootId} /> : null;
    }
    if (showPermissionsPanel && rootId) {
        return (
            <div className={clsx(styles.container, props.codeBlockProps?.title && styles.withTitle)}>
                <PermissionsPanel documentRootId={rootId} className={clsx(styles.codeBlock)} />
                <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>
            </div>
        );
    }

    return <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>;
});

export default CmsCode;
