import Card from '@tdev-components/shared/Card';
import clsx from 'clsx';
import React from 'react';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';

interface Props {
    /** the rendered inline node, opens the popover when clicked */
    trigger: React.ReactElement;
    title: string;
    children: React.ReactNode;
}

/**
 * Edits the attributes of an inline node (math, icons, raw mdx...) in a popover.
 */
const InlinePopover = (props: Props) => {
    return (
        <Popup
            trigger={props.trigger}
            on="click"
            position={['bottom center', 'top center']}
            keepTooltipInside="#__docusaurus"
            arrow={false}
            nested
        >
            <Card header={<h5>{props.title}</h5>} classNames={{ card: styles.card, body: clsx(styles.body) }}>
                {props.children}
            </Card>
        </Popup>
    );
};

export default InlinePopover;
