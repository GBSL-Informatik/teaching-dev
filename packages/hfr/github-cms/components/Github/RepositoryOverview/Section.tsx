import clsx from 'clsx';
import type React from 'react';
import styles from './styles.module.scss';

interface Props {
    title: string;
    /** shown next to the title, they act on the content of this section */
    actions?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * A framed part of the repository overview, e.g. the local changes.
 */
const Section = ({ title, actions, children }: Props) => {
    return (
        <section className={clsx(styles.section)}>
            <div className={clsx(styles.sectionHeader)}>
                <h5>{title}</h5>
                {actions}
            </div>
            {children}
        </section>
    );
};

export default Section;
