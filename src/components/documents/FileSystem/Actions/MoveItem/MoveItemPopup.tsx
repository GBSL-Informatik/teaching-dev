import { mdiFileMove, mdiFolderMove } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import MoveItem from '.';

interface Props {
    item: iFileSystem | File | Directory;
    iconSide?: 'left' | 'right';
}

const MoveItemPopup = observer((props: Props) => {
    const { item } = props;
    return (
        <Popup
            trigger={
                <span>
                    <Button
                        text="Verschieben"
                        color="blue"
                        iconSide={props.iconSide ?? 'right'}
                        icon={item.type === 'dir' ? mdiFolderMove : mdiFileMove}
                        size={1}
                    />
                </span>
            }
            modal
            nested
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            on="click"
        >
            <MoveItem item={item} />
        </Popup>
    );
});
export default MoveItemPopup;
