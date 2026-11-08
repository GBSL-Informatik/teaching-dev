import { mdiLanguageMarkdown } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import SourceEditor from '../../../editor/SourceEditor';
import File from '../../../models/File';
import Actions from '../../MdxEditor/toolbar/Actions';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

const DefaultEditor = observer((props: Props) => {
    const { file } = props;
    if (!file || file.type !== 'file') {
        return null;
    }

    return (
        <div className={clsx(styles.codeEditor)}>
            <div className={clsx(styles.header)}>
                <Actions file={file} />
                <div>{file.path}</div>
                {file.isMarkdown && (
                    <Button
                        icon={mdiLanguageMarkdown}
                        color="blue"
                        size={SIZE_S}
                        onClick={() => file.setPreventMdxEditor(false)}
                    />
                )}
            </div>
            <SourceEditor file={file} />
        </div>
    );
});

export default DefaultEditor;
