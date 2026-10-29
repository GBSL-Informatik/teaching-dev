import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_PENDING_EVENTS, type ExecutionEvent } from '../events';
import WorkerEventSession from '../workers/WorkerEventSession';

const createSession = () => {
    const sendMessage = vi.fn();
    const session = new WorkerEventSession({ id: 'editor', executionId: 1, sendMessage, getTime: Date.now }, [
        'cookie_klicker'
    ]);
    const source = session.source('cookie_klicker', 'demo');
    return { session, source, sendMessage };
};

const click: ExecutionEvent = {
    editorId: 'editor',
    executionId: 1,
    extension: 'cookie_klicker',
    targetId: 'demo',
    timeStamp: 123,
    event: { type: 'click', payload: null }
};

afterEach(() => vi.useRealTimers());

describe('Pyodide event sessions', () => {
    it('queues events in arrival order and wakes an idle receiver', async () => {
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        expect(session.deliver(click)).toBe('accepted');
        expect(session.deliver({ ...click, timeStamp: 124 })).toBe('accepted');
        expect(await session.nextEvent()).toEqual(click);
        expect((await session.nextEvent())?.timeStamp).toBe(124);
        const next = session.nextEvent();
        session.deliver({ ...click, timeStamp: 125 });
        expect((await next)?.timeStamp).toBe(125);
        await session.close();
    });

    it('rejects old executions and unsubscribed targets', async () => {
        const { session, source } = createSession();
        expect(session.deliver(click)).toBe('inactive');
        await session.open(JSON.stringify([source]));
        expect(session.deliver({ ...click, executionId: 2 })).toBe('inactive');
        expect(session.deliver({ ...click, editorId: 'other' })).toBe('inactive');
        expect(session.deliver({ ...click, targetId: 'other' })).toBe('inactive');
        await session.close();
    });

    it('validates every descriptor, including an expired duplicate', async () => {
        const { session, source } = createSession();
        await expect(session.open(JSON.stringify([{ ...source, executionId: 0 }, source]))).rejects.toThrow(
            'Invalid or expired event source'
        );
        await session.close();
    });

    it('closes an idle receiver and discards queued events on stop', async () => {
        const { session, source, sendMessage } = createSession();
        await session.open(JSON.stringify([source]));
        const waiting = session.nextEvent();
        session.stop();
        expect(await waiting).toBeUndefined();
        expect(session.deliver(click)).toBe('inactive');
        await session.close();
        await session.close();
        expect(sendMessage).toHaveBeenCalledTimes(2);
        expect(sendMessage.mock.lastCall?.[0].operation).toBe('close');
        expect(() => session.source('cookie_klicker', 'demo')).toThrow('session has ended');
    });

    it('reports overflow without silently replacing queued clicks', async () => {
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        for (let index = 0; index < MAX_PENDING_EVENTS; index++) {
            expect(session.deliver({ ...click, timeStamp: index })).toBe('accepted');
        }
        expect(session.deliver(click)).toBe('overflow');
        expect((await session.nextEvent())?.timeStamp).toBe(0);
        session.stop();
        expect(await session.nextEvent()).toBeUndefined();
        await session.close();
    });

    it('closes ingress after subscription failure', async () => {
        const { session, source, sendMessage } = createSession();
        sendMessage.mockRejectedValueOnce(new Error('source already owned'));
        await expect(session.open(JSON.stringify([source]))).rejects.toThrow('source already owned');
        expect(session.deliver(click)).toBe('inactive');
        expect(await session.nextEvent()).toBeUndefined();
        await session.close();
    });

    it('allows only one event pump and receiver', async () => {
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        await expect(session.open(JSON.stringify([source]))).rejects.toThrow('Only one webio.run()');
        const pending = session.nextEvent();
        expect(() => session.nextEvent()).toThrow('Only one event receiver');
        await session.close();
        expect(await pending).toBeUndefined();
    });

    it('collects input until a frame is due and drains it in arrival order', async () => {
        vi.useFakeTimers();
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        const frame = session.nextFrame(30);
        session.deliver(click);
        await vi.advanceTimersByTimeAsync(15);
        session.deliver({ ...click, timeStamp: 124 });
        expect(vi.getTimerCount()).toBe(1);
        await vi.advanceTimersByTimeAsync(15);
        expect(await frame).toEqual([click, { ...click, timeStamp: 124 }]);

        const next = session.nextFrame(30);
        await vi.advanceTimersByTimeAsync(30);
        expect(await next).toEqual([]);
        await session.close();
    });

    it('cancels a pending frame on stop without leaving timers or queued input', async () => {
        vi.useFakeTimers();
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        const frame = session.nextFrame(1000);
        session.deliver(click);
        session.stop();
        expect(await frame).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
        expect(await session.nextFrame(0)).toBeUndefined();
        expect(session.deliver(click)).toBe('inactive');
        await session.close();
    });

    it('yields overdue frames and keeps only one receiver', async () => {
        vi.useFakeTimers();
        const { session, source } = createSession();
        await session.open(JSON.stringify([source]));
        const frame = session.nextFrame(0);
        expect(() => session.nextEvent()).toThrow('Only one event receiver');
        expect(() => session.nextFrame(0)).toThrow('Only one event receiver');
        session.deliver(click);
        expect(() => session.nextEvent()).toThrow('Only one event receiver');
        await vi.advanceTimersByTimeAsync(0);
        expect(await frame).toEqual([click]);

        const event = session.nextEvent();
        expect(() => session.nextFrame(0)).toThrow('Only one event receiver');
        await session.close();
        expect(await event).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });
});
