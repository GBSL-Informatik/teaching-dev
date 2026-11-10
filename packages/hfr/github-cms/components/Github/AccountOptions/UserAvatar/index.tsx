import { mdiAccountCircle, mdiAlertDecagram, mdiCheckDecagram, mdiDotsVertical } from '@mdi/js';
import Icon from '@mdi/react';
import Avatar from '@tdev-components/shared/Avatar';
import Button from '@tdev-components/shared/Button';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import AccountOptions from '..';
import { useCmsStore } from '../../../../hooks/useCmsStore';
import RepositoryOverview from '../../RepositoryOverview';
import styles from './styles.module.scss';

interface Props {
    showOptions?: boolean;
}

const UserAvatar = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const { github } = cmsStore;
    const overviewRef = React.useRef<PopupActions>(null);

    if (!github?.user) {
        return null;
    }

    return (
        <div className={clsx(styles.ghUser)}>
            <Avatar
                imgSrc={github.user.avatar_url}
                name={
                    <span>
                        {github.user.login}{' '}
                        <Icon
                            path={github.canWrite ? mdiCheckDecagram : mdiAlertDecagram}
                            color={github.canWrite ? 'var(--ifm-color-success)' : 'var(--ifm-color-danger)'}
                            size={SIZE_XS}
                            title={github.canWrite ? 'Kann Änderungen vornehmen' : 'Keine Schreibrechte'}
                        />
                    </span>
                }
                size="sm"
                href={github.user.html_url}
                className={clsx(styles.avatar)}
                description={
                    <a
                        href={
                            cmsStore.activeBranch?.PR
                                ? cmsStore.activeBranch.PR.htmlUrl
                                : github.repo?.html_url
                        }
                        target="_blank"
                    >
                        {`${cmsStore.repoOwner}/${cmsStore.repoName}`}
                    </a>
                }
            />
            {props.showOptions && (
                <div className={clsx(styles.options)}>
                    <Popup
                        trigger={
                            <div>
                                <Button icon={mdiAccountCircle} size={SIZE_S} title="Github Account" />
                            </div>
                        }
                        modal
                        on="click"
                        overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                        <AccountOptions />
                    </Popup>
                    <Popup
                        ref={overviewRef}
                        trigger={
                            <div>
                                <Button
                                    icon={mdiDotsVertical}
                                    size={SIZE_S}
                                    title="Pull Requests und Branches"
                                />
                            </div>
                        }
                        modal
                        on="click"
                        overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                        <RepositoryOverview onClose={() => overviewRef.current?.close()} />
                    </Popup>
                </div>
            )}
        </div>
    );
});

export default UserAvatar;
