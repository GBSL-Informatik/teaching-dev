import { JsxComponentDescriptor } from '@mdxeditor/editor';
import RemoveNode from '../../RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiFormatListCheckbox } from '@mdi/js';
import Icon from '@mdi/react';

const DocCardListDescriptor: JsxComponentDescriptor = {
    name: 'DocCardList',
    source: '@theme/DocCardList',
    defaultExport: true,
    kind: 'flow',
    hasChildren: false,
    props: [],
    Editor: () => {
        return (
            <div className={clsx(styles.docCardList, 'card')}>
                <div className={clsx(styles.header, 'card__header')}>
                    <h4>
                        <code>{`<DocCardList />`}</code>
                    </h4>
                    <RemoveNode />
                </div>
                <div className={clsx(styles.body, 'card__body')}>
                    <Icon path={mdiFormatListCheckbox} size={3} color="var(--ifm-color-primary)" />
                </div>
            </div>
        );
    }
};
export default DocCardListDescriptor;
