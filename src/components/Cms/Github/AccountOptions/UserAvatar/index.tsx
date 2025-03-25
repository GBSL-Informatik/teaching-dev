import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Avatar from '@tdev-components/shared/Avatar';
import Icon from '@mdi/react';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import { mdiAccountCircle, mdiAlertDecagram, mdiCheckDecagram } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import AccountOptions from '..';
import Popup from 'reactjs-popup';

interface Props {
    showOptions?: boolean;
}

const UserAvatar = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { github } = cmsStore;

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
                <Popup
                    trigger={
                        <div>
                            <Button icon={mdiAccountCircle} size={SIZE_S} />
                        </div>
                    }
                    modal
                    on="click"
                    overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                >
                    <AccountOptions />
                </Popup>
            )}
        </div>
    );
});

export default UserAvatar;
