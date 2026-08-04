/**
 * Generated with Sonnet 5 @ claude.ai 4-8-2026
 */
import StudentGroup from '@tdev-models/StudentGroup';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { CSSProperties } from 'react';
import Alert from '@tdev-components/shared/Alert';
import Loader from '@tdev-components/Loader';
import { useStore } from '@tdev-hooks/useStore';
import { Access } from '@tdev-api/document';

/**
 * SpinningWheel
 * A carnival-style prize wheel with a centered push button.
 * On spin end, the selected option is announced via window.alert.
 */

interface Props {
    group: StudentGroup;
    size: number;
}

const PALETTE: string[] = [
    '#FF6B6B', // coral
    '#FFD23F', // sunflower
    '#06D6A0', // mint
    '#3A86FF', // sky
    '#9B5DE5', // grape
    '#F15BB5', // flamingo
    '#FF9F45', // tangerine
    '#00C2A8' // teal
];

const INK = '#1B1B3A';
const CREAM = '#FFFCF7';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 1, end.x, end.y, 'Z'].join(' ');
}

const SpinningWheel = observer((props: Props) => {
    const { group, size } = props;
    const students = group.students;
    const permissionStore = useStore('permissionStore');
    const rootId = group.presentedDocument?.documentRootId;

    const n = students.length;
    const [rotation, setRotation] = React.useState<number>(0);
    const [spinning, setSpinning] = React.useState<boolean>(false);
    const [selected, setSelected] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const sliceAngle = n > 0 ? 360 / n : 0;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;
    const labelR = r * 0.62;
    const fontSize = Math.max(11, Math.min(18, 220 / Math.max(n, 4)));

    const handleSpin = React.useCallback(async () => {
        if (spinning || n < 2) {
            return;
        }
        setSelected(null);
        setSpinning(true);
        await Promise.all(
            permissionStore
                .userPermissionsByDocumentRoot(rootId)
                .filter((u) => group.userIds.has(u.userId) && !group.adminIds.has(u.userId))
                .map((p) => {
                    return permissionStore.deleteUserPermission(p);
                })
        );

        const targetIndex = Math.floor(Math.random() * n);
        const jitter = (Math.random() - 0.5) * sliceAngle * 0.6;
        const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
        const extraSpins = 6 + Math.floor(Math.random() * 3);
        const currentMod = ((rotation % 360) + 360) % 360;
        const delta = (360 - targetSliceCenter - currentMod + jitter + 360) % 360;
        const newRotation = rotation + extraSpins * 360 + delta;

        setRotation(newRotation);

        const duration = 4200;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
            setSpinning(false);
            const picked = students[targetIndex];
            console.log(`SpinningWheel: selected ${picked.nameShort}`);
            setSelected(picked.nameShort);
            if (!rootId) {
                return;
            }
            const currentPermission = permissionStore
                .userPermissionsByDocumentRoot(rootId)
                .find((p) => p.userId === picked.id);
            if (currentPermission) {
                await permissionStore.deleteUserPermission(currentPermission);
            } else {
                await permissionStore.createUserPermission(rootId, picked, Access.RW_User);
            }
        }, duration);
    }, [spinning, n, rotation, sliceAngle, students, rootId]);
    if (n < 2) {
        return <Alert type="warning">Die Gruppe muss mindestens zwei Mitglieder haben.</Alert>;
    }

    const pegCount = Math.max(12, n * 2);
    const pegs = Array.from({ length: pegCount }, (_, i) => {
        const angle = (360 / pegCount) * i;
        const pos = polarToCartesian(cx, cy, r + 6, angle);
        return { ...pos, lit: i % 2 === 0 };
    });

    const wheelStyle: CSSProperties = { transform: `rotate(${rotation}deg)` };

    return (
        <div className={clsx(styles.swRoot)} style={{ width: size + 40 }}>
            <div className={clsx(styles.swStage)} style={{ width: size, height: size }}>
                <svg
                    className={clsx(styles.swPointer, selected && styles.bounce)}
                    viewBox="0 0 34 40"
                    width="34"
                    height="40"
                    aria-hidden="true"
                >
                    <path d="M17 40 L2 12 A17 17 0 0 1 32 12 Z" fill={INK} />
                    <circle cx="17" cy="12" r="5" fill="#FFD23F" />
                </svg>

                <div className={clsx(styles.swWheelWrap)}>
                    <svg
                        className={clsx(styles.swWheel)}
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        style={wheelStyle}
                    >
                        <circle cx={cx} cy={cy} r={r + 8} fill={INK} />
                        {pegs.map((p, i) => (
                            <circle
                                key={i}
                                className={clsx(styles.swPeg)}
                                cx={p.x}
                                cy={p.y}
                                r={3}
                                fill={p.lit ? '#FFD23F' : '#3A3A63'}
                            />
                        ))}
                        {students.map((s, i) => {
                            const start = i * sliceAngle;
                            const end = start + sliceAngle;
                            const mid = start + sliceAngle / 2;
                            const pos = polarToCartesian(cx, cy, labelR, mid);
                            const label =
                                s.nameShort.length > 16 ? s.nameShort.slice(0, 15) + '…' : s.nameShort;
                            return (
                                <g key={i}>
                                    <path
                                        d={wedgePath(cx, cy, r, start, end)}
                                        fill={PALETTE[i % PALETTE.length]}
                                        stroke={CREAM}
                                        strokeWidth="2"
                                    />
                                    <text
                                        className={clsx(styles.swLabel)}
                                        x={pos.x}
                                        y={pos.y}
                                        fontSize={fontSize}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(${mid - 90}, ${pos.x}, ${pos.y})`}
                                    >
                                        {label}
                                    </text>
                                </g>
                            );
                        })}
                        <circle cx={cx} cy={cy} r={r * 0.24} fill={CREAM} stroke={INK} strokeWidth="3" />
                    </svg>
                </div>

                <button className={clsx(styles.swCenterBtn)} onClick={handleSpin} disabled={spinning}>
                    {spinning ? <Loader noLabel spin={-2} /> : (selected ?? 'SPIN')}
                </button>
            </div>
        </div>
    );
});

export default SpinningWheel;
