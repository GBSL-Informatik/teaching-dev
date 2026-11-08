import { mdiCodeBraces, mdiImageOutline, mdiPlusBoxOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import { hasFrontmatter, insertBlock, insertFrontmatter, insertInline } from '../commands';
import ImageDialog from '../components/ImageDialog';
import type MdxDocument from '../models/MdxDocument';
import { schema } from '../schema';
import { INSERT_SECTIONS, type MenuItem } from './insertItems';
import styles from './styles.module.scss';

const { nodes } = schema;

const InsertMenu = observer(({ document }: { document: MdxDocument }) => {
    const ref = React.useRef<PopupActions>(null);
    const [showImageDialog, setShowImageDialog] = React.useState(false);

    const handleInsert = (item: MenuItem) => {
        document.run(item.inline ? insertInline(item.create()) : insertBlock(item.create()));
        ref.current?.close();
    };

    return (
        <>
            <Popup
                ref={ref}
                trigger={
                    <span>
                        <Button icon={mdiPlusBoxOutline} size={SIZE_S} text="Einfügen" iconSide="left" />
                    </span>
                }
                on="click"
                position={['bottom left', 'bottom right']}
                keepTooltipInside="#__docusaurus"
                arrow={false}
            >
                <Card classNames={{ body: clsx(styles.menu) }}>
                    <Button
                        icon={mdiImageOutline}
                        text="Bild"
                        iconSide="left"
                        onClick={() => {
                            ref.current?.close();
                            setShowImageDialog(true);
                        }}
                    />
                    {INSERT_SECTIONS.map((section) => (
                        <React.Fragment key={section.title}>
                            <div className={clsx(styles.menuTitle)}>{section.title}</div>
                            {section.items.map((item) => (
                                <Button
                                    key={item.label}
                                    icon={item.icon}
                                    text={item.label}
                                    iconSide="left"
                                    onClick={() => handleInsert(item)}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                    {!hasFrontmatter(document.state) && (
                        <>
                            <div className={clsx(styles.menuTitle)}>Dokument</div>
                            <Button
                                icon={mdiCodeBraces}
                                text="Frontmatter"
                                iconSide="left"
                                onClick={() => {
                                    document.run(insertFrontmatter);
                                    ref.current?.close();
                                }}
                            />
                        </>
                    )}
                </Card>
            </Popup>
            <Popup
                open={showImageDialog}
                onClose={() => setShowImageDialog(false)}
                modal
                overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            >
                <ImageDialog
                    onClose={() => setShowImageDialog(false)}
                    onSelect={(src) => document.run(insertInline(nodes.image.create({ src })))}
                />
            </Popup>
        </>
    );
});

export default InsertMenu;
