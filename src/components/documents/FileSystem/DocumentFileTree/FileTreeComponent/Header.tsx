import { mdiMagnify } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { useFileTreeModel } from './WithFileTreeModel';

interface Props {}

const Header = observer((props: Props) => {
    const model = useFileTreeModel();
    return (
        <div className={clsx(styles.header)}>
            {model.isSearchOpen() && 'Suche...'}
            <Button
                icon={mdiMagnify}
                size={SIZE_S}
                color="red"
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={() => {
                    if (model.isSearchOpen()) {
                        console.log('Closing search');
                        model.closeSearch();
                        return;
                    }
                    console.log('Opening search');
                    model.openSearch();
                }}
            />
        </div>
    );
});

export default Header;
