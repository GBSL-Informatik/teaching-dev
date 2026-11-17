import clsx from 'clsx';
import React, { useRef, type ComponentProps, type ReactElement } from 'react';

import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import styles from './styles.module.css';

function isInSummary(node: HTMLElement | null): boolean {
    if (!node) {
        return false;
    }
    return node.tagName === 'SUMMARY' || isInSummary(node.parentElement);
}

function hasParent(node: HTMLElement | null, parent: HTMLElement): boolean {
    if (!node) {
        return false;
    }
    return node === parent || hasParent(node.parentElement, parent);
}

export type DetailsProps = {
    /**
     * Summary is provided as props, optionally including the wrapping
     * `<summary>` tag
     */
    summary: ReactElement | string;
    model: iFileSystem<any>;
} & ComponentProps<'details'>;

/**
 * The closed `<details>` hides the content itself. The height animation of Docusaurus' `Collapsible`
 * can leave nested folders at a fixed height, so their growing content overlapped the parent.
 */
const FsDetails = ({ summary, model, children, ...props }: DetailsProps): React.ReactNode => {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const summaryElement = React.isValidElement(summary) ? summary : <summary>{summary}</summary>;
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <details
            {...props}
            ref={detailsRef}
            open={model.isOpen}
            className={clsx(
                'alert',
                !/\balert--/.test(props.className || '') && 'alert--info',
                styles.details,
                props.className
            )}
            onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                // Prevent a double-click to highlight summary text
                if (isInSummary(target) && e.detail > 1) {
                    e.preventDefault();
                }
            }}
            onClick={(e) => {
                e.stopPropagation(); // For isolation of multiple nested details/summary
                const target = e.target as HTMLElement;
                const shouldToggle = isInSummary(target) && hasParent(target, detailsRef.current!);
                if (!shouldToggle) {
                    return;
                }
                e.preventDefault();
                model.setIsOpen(!model.isOpen);
            }}
        >
            {summaryElement}
            <div className={clsx(styles.content)}>{children}</div>
        </details>
    );
};

export default FsDetails;
