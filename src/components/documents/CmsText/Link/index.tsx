import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import DivSpanWrapper from '@tdev-components/shared/DivSpanWrapper';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Props as DefaultCmsProps, EmptyContent } from '..';
import CmsActions from '../CmsActions';
import { CmsTextEntries } from '../WithCmsText';
import styles from './styles.module.scss';

interface Props extends DefaultCmsProps {
    children?: React.ReactNode;
    inline?: boolean;
}

const CmsLink = observer((props: Props) => {
    const { id, name, showActions } = props;
    const userStore = useStore('userStore');
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const documentRootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(documentRootId);
    const isBrowser = useIsBrowser();
    if (!isBrowser) {
        return null;
    }
    const actionEntries =
        showActions && documentRootId ? ({ [documentRootId]: documentRootId } as CmsTextEntries) : undefined;

    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return actionEntries ? (
            <CmsActions
                entries={actionEntries}
                className={clsx(styles.codeBlock)}
                mode="code"
                inline={props.inline}
            />
        ) : null;
    }
    if (actionEntries) {
        return (
            <DivSpanWrapper inline={props.inline} className={clsx(styles.container)}>
                <CmsActions
                    entries={actionEntries}
                    className={clsx(styles.codeBlock)}
                    mode="code"
                    inline={props.inline}
                />
                <Link to={cmsText.text}>{props.children || cmsText.text}</Link>
            </DivSpanWrapper>
        );
    }

    return (
        <Link to={cmsText.text}>
            {props.children || cmsText.text}
            {cmsText.text === '' && <EmptyContent />}
        </Link>
    );
});

export default CmsLink;
