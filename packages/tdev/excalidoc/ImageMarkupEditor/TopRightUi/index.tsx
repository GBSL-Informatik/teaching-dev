import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { observer } from 'mobx-react-lite';
import {
    mdiContentSave,
    mdiDraw,
    mdiFormatFontSizeDecrease,
    mdiFormatFontSizeIncrease,
    mdiImageOffOutline,
    mdiMinus,
    mdiPlus
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { getSelectedStrokeElements } from '../helpers/getSelectedStrokeElements';
import updateElementsWith from '../helpers/updateElementsWith';
import restoreElementsWith from '../helpers/restoreElementsWith';
import type { ExcalidrawFreeDrawElement, ExcalidrawTextElement } from '@excalidraw/excalidraw/element/types';
import ChangeSrcPopup from './ChangeSrcPopup';
import Icon from '@mdi/react';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props {
    onSave: () => void;
    hasChanges: boolean;
    showLineActions: boolean;
    freedrawState: 'off' | 'partial' | 'on' | null;
    selectedTextId: string | null;
    api: ExcalidrawImperativeAPI;
    updateScene: (appState: ExcalidrawInitialDataState) => void;
    restoreFn: typeof ExcalidrawLib.restoreElements;
    hasBGImage: boolean;
}

const roundedWidth = (num: number) => {
    const width = Math.round(num * 10000000000) / 10000000000;
    return Math.max(0.1, width);
};

const updatedStrokeWidth = (current: number, direction: 'increase' | 'decrease') => {
    let dt = 0; // Change in stroke width
    const abs = Math.abs(current);
    if (abs <= 1) {
        if (direction === 'increase' && abs === 1) {
            dt = 1;
        } else {
            dt = abs / (direction === 'increase' ? 5 : 6);
        }
    } else if (abs < 5) {
        dt = 1;
    } else {
        dt = 2;
    }
    return roundedWidth(direction === 'increase' ? current + dt : current - dt);
};

const TopRightUi = observer((props: Props) => {
    const { hasChanges, showLineActions, selectedTextId, api, restoreFn, onSave, hasBGImage, freedrawState } =
        props;
    return (
        <div className={clsx(styles.topRightUI)}>
            {hasBGImage && <ChangeSrcPopup updateScene={props.updateScene} api={api} />}
            {!hasBGImage && (
                <Icon
                    path={mdiImageOffOutline}
                    color="var(--ifm-color-primary)"
                    size={SIZE_S}
                    title="Kein Hintergrundbild vorhanden."
                />
            )}

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
            {freedrawState && (
                <div className={styles.actions}>
                    <Button
                        icon={mdiDraw}
                        color={
                            freedrawState === 'on'
                                ? 'primary'
                                : freedrawState === 'partial'
                                  ? 'orange'
                                  : 'grey'
                        }
                        title={`Stiftdruck ${freedrawState === 'off' ? 'aktivieren' : 'deaktivieren'}.`}
                        onClick={() => {
                            const freedrawElements = getSelectedStrokeElements(api).filter(
                                (e) => e.type === 'freedraw'
                            );
                            if (freedrawState === 'off') {
                                updateElementsWith<ExcalidrawFreeDrawElement>(api, freedrawElements, (e) => {
                                    const cData = { ...(e.customData || {}) };
                                    const pressures = e.customData?.pressures || [];
                                    delete cData.pressures;
                                    return {
                                        simulatePressure: pressures.length === 0,
                                        pressures: pressures,
                                        customData: cData
                                    };
                                });
                            } else {
                                updateElementsWith<ExcalidrawFreeDrawElement>(api, freedrawElements, (e) => ({
                                    simulatePressure: false,
                                    pressures: [],
                                    customData:
                                        e.pressures.length > 0
                                            ? {
                                                  ...(e.customData || {}),
                                                  pressures: e.pressures
                                              }
                                            : e.customData
                                }));
                            }
                        }}
                    />
                </div>
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
                                    strokeWidth: updatedStrokeWidth(e.strokeWidth, 'decrease')
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
                                    strokeWidth: updatedStrokeWidth(e.strokeWidth, 'increase')
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
