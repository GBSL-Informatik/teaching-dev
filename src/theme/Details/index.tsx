import { Details as DetailsGeneric } from '@docusaurus/theme-common/Details';
import type { Props } from '@theme/Details';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

const hasAlertType = (className?: string) => /\balert--/.test(className || '');

/**
 * Same as the Docusaurus Details, but keeps an alert type (e.g. `alert--danger`) set by the remark-details plugin.
 * The original always adds `alert--info`, which overrides some of the other types.
 */
export default function Details(props: Props): React.ReactNode {
    return (
        <DetailsGeneric
            {...props}
            className={clsx(
                'alert',
                !hasAlertType(props.className) && 'alert--info',
                styles.details,
                props.className
            )}
        />
    );
}
