import clsx from 'clsx';
import styles from './styles.module.scss';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import DefinitionList from '@tdev-components/DefinitionList';
import { BACKEND_URL } from '@tdev/authConfig';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiCloseCircle, mdiConnection } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import React from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';

const HomepageFeatures = observer(() => {
    const socketStore = useStore('socketStore');
    const userStore = useStore('userStore');
    const isBrowser = useIsBrowser();
    const isLive = isBrowser && socketStore.isLive;
    return (
        <section className={styles.features}>
            <div className="container">
                <h2>Socket.IO</h2>
                <DefinitionList>
                    <dt>URL</dt>
                    <dd>{BACKEND_URL}</dd>
                    <dt>Connected?</dt>
                    <dd>
                        {isLive ? (
                            <span>
                                <Icon path={mdiCheckCircle} size={0.8} color="var(--ifm-color-success)" />{' '}
                                Live
                            </span>
                        ) : (
                            <span>
                                <Icon path={mdiCloseCircle} size={0.8} color="var(--ifm-color-danger)" />{' '}
                                Offline
                            </span>
                        )}
                    </dd>
                    {isLive && (
                        <>
                            <dt>Clients</dt>
                            <dd>{socketStore.connectedClients.get(userStore.viewedUser?.id ?? '') ?? 0}</dd>
                        </>
                    )}
                    <dt>Connection</dt>
                    <dd>
                        <Button
                            icon={mdiConnection}
                            text="Connect"
                            onClick={() => {
                                socketStore.resetUserData();
                                socketStore.connect();
                            }}
                            disabled={isLive}
                            color="blue"
                        />
                    </dd>
                    <dd>
                        <Button
                            icon={mdiCloseCircle}
                            text="Disconnect"
                            onClick={() => socketStore.disconnect()}
                            disabled={!isLive}
                            color="red"
                        />
                    </dd>
                </DefinitionList>
            </div>
        </section>
    );
});

export default HomepageFeatures;
