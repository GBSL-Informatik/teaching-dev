import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import File from '../../../../../../models/File';
import styles from './styles.module.scss';

interface Props {
    file: File;
    maxWidth?: string | number;
    maxHeight?: string | number;
}

const getLanguage = (extension: string) => {
    const ext = extension.toLowerCase();
    switch (ext) {
        case 'mdx':
            return 'markdown';
        default:
            return ext;
    }
};

const TextPreview = observer((props: Props) => {
    const { file } = props;
    return (
        <div
            className={clsx(styles.preview)}
            style={{ maxWidth: props.maxWidth, maxHeight: props.maxHeight }}
        >
            <CodeBlock language={getLanguage(file.extension)}>{file.content}</CodeBlock>
        </div>
    );
});

export default TextPreview;
