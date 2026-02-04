import type { TaskableType } from '@tdev-api/document';
import iDocument from './iDocument';

export interface iTaskableDocument<T extends TaskableType = TaskableType> extends iDocument<T> {
    isDone: boolean;
    editingIconState: { path: string; color: string };
    progress: number;
    totalSteps: number;
    setScrollTo(scroll: boolean): void;
}
