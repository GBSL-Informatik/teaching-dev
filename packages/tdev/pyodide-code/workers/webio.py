"""Execution-owned browser events for Teaching Dev."""

# installWebio.ts injects _bridge into this module's globals before execution.
# Its type declaration below informs Pylance without overwriting the injected value.

import inspect
import json
import math
from collections.abc import Awaitable
from time import perf_counter
from types import SimpleNamespace
from typing import Any, Protocol


class _EventBridge(Protocol):
    def open(self, sources: str) -> Awaitable[None]: ...
    def next_event(self) -> Awaitable[Any]: ...
    def next_frame(self, delay_ms: float) -> Awaitable[Any]: ...
    def stop(self) -> None: ...
    def close(self) -> Awaitable[None]: ...


_bridge: _EventBridge

_handlers = []
_started = False
_stopping = False
_game_loop = None


def on_event(event_type=None, *, source):
    """Register on one or more sources; None and '*' match every event type."""
    if event_type is None:
        event_type = '*'
    if not isinstance(event_type, str):
        raise TypeError('An event type must be a string or None.')
    if not event_type:
        raise ValueError('An event type must not be empty; use None or omit it for all events.')
    sources = _event_sources(source)

    def register(handler):
        if _started:
            raise RuntimeError('Register handlers before calling webio.run().')
        if not callable(handler):
            raise TypeError('An event handler must be callable.')
        for event_source in sources:
            _handlers.append((event_type, event_source, handler))
        return handler

    return register


def on_click(target):
    """Register a click handler for any extension handle exposing an events source."""
    return on_event('click', source=target.events)


def on_key(target, key=None):
    """Register for every key with None or '*', or only the specified key."""
    if key is None or key == '*':
        return on_event('key', source=target.events)
    if not isinstance(key, str) or not key:
        raise ValueError('A key filter must be a non-empty string.')

    def register(handler):
        if not callable(handler):
            raise TypeError('An event handler must be callable.')

        def filtered(event):
            if event.payload.get('key') == key:
                return handler(event)

        on_event('key', source=target.events)(filtered)
        return handler

    return register


def gameloop(*, fps=30, sources):
    """Register one frame callback; time is milliseconds and dt is seconds."""
    if isinstance(fps, bool) or not isinstance(fps, (int, float)) or not math.isfinite(fps):
        raise ValueError('fps must be a finite number between 1 and 120.')
    if not 1 <= fps <= 120:
        raise ValueError('fps must be between 1 and 120.')
    event_sources = _event_sources(sources)

    def register(handler):
        global _game_loop
        if _started:
            raise RuntimeError('Register the game loop before calling webio.run().')
        if _game_loop is not None:
            raise RuntimeError('Only one game loop is allowed per execution.')
        if not callable(handler):
            raise TypeError('A game loop must be callable.')
        _game_loop = SimpleNamespace(interval=1 / fps, sources=event_sources, handler=handler)
        return handler

    return register


def stop():
    """Finish after the active handler, or wake an idle event receiver."""
    global _stopping
    _stopping = True
    _bridge.stop()


async def run():
    """Listen until stop(), a handler error, or the editor's Stop button."""
    global _started, _stopping, _game_loop
    if _started:
        raise RuntimeError('Only one webio.run() call is allowed per execution.')
    _started = True
    failure = None
    try:
        await _bridge.open(json.dumps(_subscriptions()))
        if _game_loop is None:
            await _run_events()
        else:
            await _run_frames(_game_loop)
    except BaseException as error:
        failure = error
        raise
    finally:
        _stopping = True
        _handlers.clear()
        _game_loop = None
        try:
            await _bridge.close()
        except Exception as cleanup_error:
            if failure is None:
                raise
            failure.add_note(f'Additional event cleanup error: {cleanup_error}')


def _event_sources(value):
    targets = tuple(value) if isinstance(value, (list, tuple)) else (value,)
    if not targets:
        raise ValueError('Register at least one event source.')
    return tuple(getattr(target, 'events', target) for target in targets)


def _subscriptions():
    sources = [source for _, source, _ in _handlers]
    if _game_loop is not None:
        sources.extend(_game_loop.sources)
    unique = {}
    for source in sources:
        key = (source.executionId, source.extension, source.targetId)
        unique[key] = {
            'extension': source.extension,
            'targetId': source.targetId,
            'executionId': source.executionId
        }
    return list(unique.values())


async def _run_events():
    while not _stopping:
        raw = await _bridge.next_event()
        if raw is None:
            return
        await _dispatch_events((_decode_event(raw.to_py()),))


async def _run_frames(game):
    started = perf_counter()
    previous = started
    deadline = started + game.interval
    frame = 0
    source_keys = {(source.extension, source.targetId) for source in game.sources}
    while not _stopping:
        delay_ms = max(0, (deadline - perf_counter()) * 1000)
        raw = await _bridge.next_frame(delay_ms)
        if raw is None:
            return
        now = perf_counter()
        events = tuple(_decode_event(data) for data in raw.to_py())
        frame += 1
        context = SimpleNamespace(
            time=(now - started) * 1000,
            dt=now - previous,
            frame=frame,
            events=tuple(event for event in events if (event.extension, event.target_id) in source_keys)
        )
        previous = now
        # A late frame skips missed deadlines instead of queuing catch-up updates.
        deadline = now + game.interval
        await _dispatch_events(events)
        if not _stopping:
            await _invoke(game.handler, context)


async def _dispatch_events(events):
    for event in events:
        for event_type, source, handler in _handlers:
            if _stopping:
                return
            if event_type != '*' and event.type != event_type:
                continue
            if (event.extension, event.target_id) != (source.extension, source.targetId):
                continue
            await _invoke(handler, event)


async def _invoke(handler, argument):
    result = handler(argument)
    if inspect.isawaitable(result):
        await result


def _decode_event(data):
    event = SimpleNamespace(
        type=data['event']['type'],
        extension=data['extension'],
        target_id=data['targetId'],
        timestamp=data['timeStamp'],
        payload=data['event']['payload']
    )
    if isinstance(event.payload, dict):
        for coordinate in ('x', 'y'):
            if coordinate in event.payload:
                setattr(event, coordinate, event.payload[coordinate])
    return event
