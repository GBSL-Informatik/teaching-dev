import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Details from '@theme/Details';
import Loader from '../../Loader';
import { MetaInit, ModelMeta } from '@site/src/models/documents/Solution';
import { useDocumentRoot } from '@site/src/hooks/useDocumentRoot';
import { Access } from '@site/src/api/document';
import { useStore } from '@site/src/hooks/useStore';
import Icon from '@mdi/react';
import { mdiCheckAll } from '@mdi/js';
import PermissionsPanel from '../../PermissionsPanel';

interface Props extends MetaInit {
    id: string;
    standalone?: boolean;
    title?: string;
    open?: boolean;
    className?: string;
    children: JSX.Element;
}

const Solution = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const docRoot = useDocumentRoot(props.id, meta, false);
    const userStore = useStore('userStore');
    if (!docRoot || docRoot.isDummy) {
        return <Loader />;
    }
    return (
        <div className={clsx(styles.wrapper, props.standalone && styles.standalone)}>
            {docRoot.access !== Access.None || userStore.current?.isAdmin ? (
                <Details
                    summary={
                        <summary>
                            <div className={styles.summary}>
                                {props.title || 'Lösung'}
                                <div style={{ flex: '1 1 0' }} />
                                {userStore.current?.isAdmin && (
                                    <PermissionsPanel documentRootId={docRoot.id} />
                                )}
                                {docRoot.access === Access.None && (
                                    <span className="badge badge--secondary">Hidden</span>
                                )}
                                <Icon
                                    path={mdiCheckAll}
                                    className={styles.summaryIcon}
                                    size={1}
                                    color="var(--ifm-color-success)"
                                />
                            </div>
                        </summary>
                    }
                    className={clsx('alert alert--success', styles.solution)}
                    open={props.open}
                    key={`poly-${props.open}`}
                >
                    <div className={clsx(props.className)}>{props.children}</div>
                </Details>
            ) : (
                <div className={clsx('alert', styles.disabled)}>
                    {props.title || 'Lösung'} (nicht freigeschaltet) <Icon path={mdiCheckAll} />
                </div>
            )}
        </div>
    );
});

export default Solution;
