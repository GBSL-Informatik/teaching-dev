import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@tdev-models/cms/Dir';
import Card from '@tdev-components/shared/Card';
import Dir from '@tdev-components/Cms/Github/iFile/Dir';
import Avatar from '@tdev-components/shared/Avatar';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiAlertDecagram, mdiCheckDecagram, mdiLogoutVariant } from '@mdi/js';
import Badge from '@tdev-components/shared/Badge';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    dir?: DirModel;
    className?: string;
    contentClassName?: string;
    showActions?: 'always' | 'hover';
    compact?: boolean;
    showAvatar?: boolean;
}

const Directory = observer((props: Props) => {
    const { dir } = props;
    const cmsStore = useStore('cmsStore');
    const { github } = cmsStore;
    React.useEffect(() => {
        if (dir && !dir.isOpen) {
            console.log('Open from Directory.tsx');
            dir.setOpen(true);
        }
    }, [dir]);
    if (!dir) {
        return null;
    }

    return (
        <div className={clsx(styles.directory, props.className, props.compact && styles.compact)}>
            {github?.user && props.showAvatar && (
                <div className={clsx(styles.ghUser)}>
                    <Avatar
                        imgSrc={github.user.avatar_url}
                        name={
                            <span>
                                {github.user.login}{' '}
                                <Icon
                                    path={github.canWrite ? mdiCheckDecagram : mdiAlertDecagram}
                                    color={
                                        github.canWrite
                                            ? 'var(--ifm-color-success)'
                                            : 'var(--ifm-color-danger)'
                                    }
                                    size={SIZE_XS}
                                    title={
                                        github.canWrite ? 'Kann Änderungen vornehmen' : 'Keine Schreibrechte'
                                    }
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
                    <Button
                        onClick={() => {
                            cmsStore.logoutGithub();
                        }}
                        icon={mdiLogoutVariant}
                        title="Logout"
                    />
                </div>
            )}
            <Card
                classNames={{
                    body: styles.cardBody,
                    card: props.contentClassName
                }}
            >
                <ul className={clsx(styles.dirTree)}>
                    <Dir dir={dir} showActions={props.showActions} />
                </ul>
            </Card>
        </div>
    );
});

export default Directory;
