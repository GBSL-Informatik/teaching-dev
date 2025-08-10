import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { observer } from 'mobx-react-lite';
import {
    mdiContentSave,
    mdiFormatFontSizeDecrease,
    mdiFormatFontSizeIncrease,
    mdiMinus,
    mdiPlus
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { getSelectedStrokeElements } from '../helpers/getSelectedStrokeElements';
import updateElementsWith from '../helpers/updateElementsWith';
import restoreElementsWith from '../helpers/restoreElementsWith';
import { ExcalidrawTextElement } from '@excalidraw/excalidraw/element/types';
import ChangeSrcPopup from './ChangeSrcPopup';

interface Props {
    onSave: () => void;
    hasChanges: boolean;
    showLineActions: boolean;
    selectedTextId: string | null;
    api: ExcalidrawImperativeAPI;
    updateScene: (appState: ExcalidrawInitialDataState) => void;
    restoreFn: typeof ExcalidrawLib.restoreElements;
}

const TopRightUi = observer((props: Props) => {
    const { hasChanges, showLineActions, selectedTextId, api, restoreFn, onSave } = props;
    return (
        <div className={clsx(styles.topRightUI)}>
            <ChangeSrcPopup updateScene={props.updateScene} api={api} />

            {hasChanges && (
                <Button
                    icon={mdiContentSave}
                    color="green"
                    title="Speichern und schliessen"
                    onClick={() => {
                        onSave();
                    }}
                />
            )}
            {showLineActions && (
                <div className={styles.actions}>
                    <Button
                        icon={mdiMinus}
                        title="Linienbreite verringern"
                        color="black"
                        onClick={() => {
                            const selectedStrokes = getSelectedStrokeElements(api);
                            if (selectedStrokes.length > 0) {
                                updateElementsWith(api, selectedStrokes, (e) => ({
                                    strokeWidth: Math.max(1, e.strokeWidth - 2)
                                }));
                            }
                        }}
                    />
                    <Button
                        icon={mdiPlus}
                        title="Linienbreite vergrössern"
                        color="black"
                        onClick={() => {
                            const selectedStrokes = getSelectedStrokeElements(api);
                            if (selectedStrokes.length > 0) {
                                updateElementsWith(api, selectedStrokes, (e) => ({
                                    strokeWidth: e.strokeWidth + 2
                                }));
                            }
                        }}
                    />
                </div>
            )}
            {selectedTextId && (
                <div className={styles.actions}>
                    <Button
                        icon={mdiFormatFontSizeDecrease}
                        color="black"
                        title={'Schriftgrösse verringern'}
                        onClick={(e) => {
                            restoreElementsWith(restoreFn, api, [{ id: selectedTextId }], (e) => ({
                                fontSize: (e as ExcalidrawTextElement).fontSize / 1.2
                            }));
                        }}
                    />
                    <Button
                        icon={mdiFormatFontSizeIncrease}
                        title={'Schriftgrösse vergrössern'}
                        color="black"
                        onClick={(e) => {
                            restoreElementsWith(restoreFn, api, [{ id: selectedTextId }], (e) => ({
                                fontSize: (e as ExcalidrawTextElement).fontSize * 1.2
                            }));
                        }}
                    />
                </div>
            )}
        </div>
    );
});

export default TopRightUi;
