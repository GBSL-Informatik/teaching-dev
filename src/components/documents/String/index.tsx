import React, { useId, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import { MetaInit, ModelMeta, StringAnswer } from '@tdev-models/documents/String';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import SyncStatus from '@tdev-components/SyncStatus';
import { Source } from '@tdev-models/iDocument';
import { mdiCheckCircle, mdiCloseCircle, mdiFlashTriangle, mdiHelpCircleOutline } from '@mdi/js';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface Props extends MetaInit {
    id: string;
    placeholder?: string;
    label?: string;
    labelWidth?: string;
    inputWidth?: string;
    children?: ReactNode;
    icon?: string;
    iconColor?: string;
    type?: React.HTMLInputTypeAttribute | undefined;
    stateIconsPosition?: 'inside' | 'outside' | 'hidden';
    hideWarning?: boolean;
    hideApiState?: boolean;
    inline?: boolean;
    fullWidth?: boolean;
    unit?: React.ReactNode;
    unitWidth?: string;
}

const IconMap: { [key in StringAnswer]: string } = {
    [StringAnswer.Unchecked]: mdiHelpCircleOutline,
    [StringAnswer.Correct]: mdiCheckCircle,
    [StringAnswer.Wrong]: mdiCloseCircle
};

const ColorMap: { [key in StringAnswer]: string } = {
    [StringAnswer.Unchecked]: 'secondary',
    [StringAnswer.Correct]: 'green',
    [StringAnswer.Wrong]: 'red'
};

const Unit = ({ children, unitWidth }: { children: React.ReactNode; unitWidth?: string }) => (
    <span className={clsx(styles.unit)} style={{ width: unitWidth }}>
        {children}
    </span>
);

const InputWrapper = observer(
    (props: { inline?: boolean; className?: string; style?: React.CSSProperties; children: ReactNode }) => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        const neededWidth = React.useRef(0);
        const [wrap, setWrap] = React.useState(false);

        React.useEffect(() => {
            const checkWrap = () => {
                const container = containerRef?.current;
                if (!container?.lastElementChild) {
                    return;
                }
                const parentRect = (
                    container.lastElementChild as HTMLSpanElement
                )?.offsetParent?.getBoundingClientRect();
                const childRect = (container.lastElementChild as HTMLSpanElement)?.getBoundingClientRect();
                if (!parentRect || !childRect) {
                    return;
                }
                if (childRect.right > parentRect.right && !wrap) {
                    neededWidth.current = childRect.right - parentRect.right + parentRect.width + 1;
                    setWrap(true);
                } else if (wrap && parentRect.width > neededWidth.current) {
                    setWrap(false);
                }
            };

            checkWrap();
            window.addEventListener('resize', checkWrap);
            return () => window.removeEventListener('resize', checkWrap);
        }, [wrap]);
        if (props.inline) {
            return (
                <span className={clsx(styles.inline, props.className)} style={props.style}>
                    {props.children}
                </span>
            );
        }
        return (
            <div
                className={clsx(props.className, wrap && styles.flexWrap)}
                style={props.style}
                ref={containerRef}
            >
                {props.children}
            </div>
        );
    }
);

const String = observer((props: Props & { monospace?: boolean; disabled?: boolean }) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);
    const inputId = useId();
    const inputType = props.type || 'text';
    const stateIconsPosition =
        props.stateIconsPosition ||
        (['text', 'url', 'email', 'tel'].includes(inputType) ? 'inside' : 'outside');
    const isBrowser = useIsBrowser();
    React.useEffect(() => {
        if (doc) {
            doc.checkAnswer();
        }
    }, [doc]);

    if (!doc || !isBrowser) {
        return <Loader />;
    }
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 's') {
                event.preventDefault();
                doc.saveNow();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                doc.checkAnswer();
            }
        }
    };

    const StateIcons = () => (
        <span className={clsx(styles.stateIcons, styles[stateIconsPosition])}>
            {!props.hideApiState && <SyncStatus model={doc} size={0.7} />}
            {doc.root?.isDummy && !props.hideWarning && (
                <Icon path={mdiFlashTriangle} size={0.7} color="orange" title="Wird nicht gespeichert." />
            )}
        </span>
    );

    return (
        <InputWrapper
            className={clsx(
                styles.string,
                doc.hasSolution && styles.withSolution,
                (props.label || props.children || props.icon) && styles.withLabel,
                props.unit && styles.withUnit,
                styles[doc.answer],
                styles[props.type || 'text'],
                'notranslate',
                props.monospace && styles.monospace
            )}
            inline={props.inline}
        >
            <>
                {(props.label || props.icon) && (
                    <label className={styles.label} style={{ width: props.labelWidth }} htmlFor={inputId}>
                        {props.icon && (
                            <Icon
                                className={clsx(styles.labelIcon)}
                                path={props.icon}
                                color={props.iconColor}
                                size={0.7}
                            />
                        )}
                        {props.label}
                    </label>
                )}
                {props.children && (
                    <label className={styles.label} htmlFor={inputId}>
                        {props.children}
                    </label>
                )}
                <span className={clsx(styles.inputBox, props.fullWidth && styles.fullWidth)}>
                    <input
                        type={props.type || 'text'}
                        id={inputId}
                        style={{ width: props.inputWidth }}
                        spellCheck={false}
                        onChange={(e) => {
                            doc.setData({ text: e.target.value }, Source.LOCAL);
                        }}
                        className={clsx(styles.input, props.fullWidth && styles.fullWidth)}
                        value={doc.text}
                        placeholder={props.placeholder}
                        disabled={props.readonly || props.disabled || !doc.canEdit}
                        onKeyDown={handleKeyDown}
                    />
                    {stateIconsPosition === 'inside' && <StateIcons />}
                </span>
                {props.unit && <Unit unitWidth={props.unitWidth}>{props.unit}</Unit>}
                {doc.hasSolution && (
                    <Button
                        onClick={() => doc.checkAnswer()}
                        className={styles.checkButton}
                        icon={IconMap[doc.answer]}
                        color={ColorMap[doc.answer]}
                        size={0.7}
                    />
                )}
                {stateIconsPosition === 'outside' && <StateIcons />}
            </>
        </InputWrapper>
    );
});

export default String;
