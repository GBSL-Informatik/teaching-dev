import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '@tdev-components/shared/Button';
import { mdiMotionPauseOutline, mdiMotionPlay, mdiMotionPlayOutline, mdiStopCircleOutline } from '@mdi/js';
// @ts-ignore
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import SerialDevice from '@tdev/webserial/models/SerialDevice';
import Badge from '@tdev-components/shared/Badge';

interface Props {
    device: SerialDevice;
}

const ReplayControl = observer((props: Props) => {
    const { device } = props;
    return (
        <div className={clsx(styles.replayControls)}>
            {(device.canReplay || device.isReplaying) && (
                <Button
                    onClick={() => {
                        device.isReplaying
                            ? device.pauseReplay()
                            : device.replay(device._replayPausedAt || 0);
                    }}
                    icon={
                        device.isReplaying
                            ? mdiMotionPauseOutline
                            : device.isReplayPaused
                              ? mdiMotionPlay
                              : mdiMotionPlayOutline
                    }
                    title={`Replay ${device.isReplaying ? 'pausieren' : 'starten'}`}
                    color={device.isReplaying || device.isReplayPaused ? 'blue' : undefined}
                />
            )}
            {(device.isReplaying || device.isReplayPaused) && (
                <Button
                    onClick={() => device.stopReplay()}
                    icon={mdiStopCircleOutline}
                    title="Replay stoppen"
                    color="red"
                />
            )}
            {(device.isReplayPaused || device.isReplaying) && (
                <div className={clsx(styles.speedControl)}>
                    <Slider
                        min={0}
                        max={995}
                        value={1000 - device.replaySpeed}
                        onChange={(value) => device.setReplaySpeed(1000 - (value as number))}
                        step={5}
                        style={{ flexBasis: '150px', margin: '0 15px' }}
                    />
                    <div>
                        Intervall <Badge color="blue">{device.replaySpeed} ms</Badge>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ReplayControl;
