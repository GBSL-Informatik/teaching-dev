import React, { type ReactNode } from 'react';
import DocSidebarItem from '@theme-original/DocSidebarItem';
import type DocSidebarItemType from '@theme/DocSidebarItem';
import type { WrapperProps } from '@docusaurus/types';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Icon from '@mdi/react';
import { mdiCheck, mdiCheckCircle, mdiProgressQuestion } from '@mdi/js';
import clsx from 'clsx';
import styles from './styles.module.scss';
const ensureTrailingSlash = (path?: string) => {
    if (!path) {
        return '';
    }
    return path.endsWith('/') ? path : path + '/';
};

type Props = WrapperProps<typeof DocSidebarItemType>;
const DocSidebarItemWrapper = observer((props: Props): ReactNode => {
    const pageStore = useStore('pageStore');
    const path = props.item.type !== 'html' ? ensureTrailingSlash(props.item.href) : undefined;
    if (!path) {
        console.log(props.item);
    }

    const page = pageStore.pages.find((p) => p.path === path);
    return (
        <div className={clsx(styles.item)}>
            <Icon
                path={page ? mdiCheckCircle : mdiProgressQuestion}
                size={0.4}
                color={page ? 'var(--ifm-color-success)' : 'var(--ifm-color-warning)'}
                className={clsx(styles.icon)}
            />
            <DocSidebarItem {...props} />
        </div>
    );
});

export default DocSidebarItemWrapper;
