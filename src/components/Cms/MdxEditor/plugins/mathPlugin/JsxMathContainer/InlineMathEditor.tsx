import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { InlineMath as MdastNodeInlineMath } from 'mdast-util-math';
import { InlineMath as KatexInline } from 'react-katex';
import Popup from 'reactjs-popup';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { useMdastNodeUpdater } from '@mdxeditor/editor';
import { PopupActions } from 'reactjs-popup/dist/types';

interface Props {
    mdastNode: MdastNodeInlineMath;
}

const InlineMathEditor = (props: Props) => {
    const { mdastNode } = props;
    const ref = React.useRef<PopupActions>(null);
    const [value, setValue] = React.useState(mdastNode.value);
    const updateMdastNode = useMdastNodeUpdater();
    return (
        <Popup
            trigger={
                <span className={clsx(styles.inlineMath)}>
                    <KatexInline>{mdastNode.value}</KatexInline>
                </span>
            }
            ref={ref}
            on="hover"
            offsetY={-5}
            nested
            closeOnEscape={true}
            keepTooltipInside="#__docusaurus"
        >
            <Card
                classNames={{ card: styles.card }}
                footer={
                    <div className={clsx('button-group', 'button-group--block')}>
                        <Button
                            onClick={() => {
                                ref.current?.close();
                            }}
                            color="black"
                            text="Abbrechen"
                        />
                        <Button
                            onClick={() => {
                                updateMdastNode({ value: value });
                                ref.current?.close();
                            }}
                            color="green"
                            text="Aktualisieren"
                        />
                    </div>
                }
            >
                <div>
                    <TextInput
                        type="text"
                        value={value}
                        onChange={(value) => {
                            // mdastNode.value = e.target.value;
                            setValue(value);
                        }}
                        noAutoFocus
                    />
                </div>
            </Card>
        </Popup>
    );
};

export default InlineMathEditor;
