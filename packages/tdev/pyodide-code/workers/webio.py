"""Execution-owned browser events for Teaching Dev."""

# installWebio.ts injects _bridge into this module's globals before execution.
# Its type declaration below informs Pylance without overwriting the injected value.

import inspect
import json
from collections.abc import Awaitable
from types import SimpleNamespace
from typing import Any, Protocol


class _EventBridge(Protocol):
    def open(self, sources: str) -> Awaitable[None]: ...
    def next_event(self) -> Awaitable[Any]: ...
    def stop(self) -> None: ...
    def close(self) -> Awaitable[None]: ...


_bridge: _EventBridge

_handlers = []
_started = False
_stopping = False


def on_event(event_type=None, *, source):
    """Register on one or more sources; None and '*' match every event type."""
    if event_type is None:
        event_type = '*'
    if not isinstance(event_type, str):
        raise TypeError('An event type must be a string or None.')
    if not event_type:
        raise ValueError('An event type must not be empty; use None or omit it for all events.')
    sources = tuple(source) if isinstance(source, (list, tuple)) else (source,)
    if not sources:
        raise ValueError('An event handler needs at least one source.')

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


def stop():
    """Finish after the active handler, or wake an idle event receiver."""
    global _stopping
    _stopping = True
    _bridge.stop()


async def run():
    """Listen until stop(), a handler error, or the editor's Stop button."""
    global _started, _stopping
    if _started:
        raise RuntimeError('Only one webio.run() call is allowed per execution.')
    _started = True
    sources = {}
    failure = None
    try:
        for _, source, _ in _handlers:
            key = (source.executionId, source.extension, source.targetId)
            sources[key] = {
                'extension': source.extension,
                'targetId': source.targetId,
                'executionId': source.executionId
            }
        await _bridge.open(json.dumps(list(sources.values())))
        while not _stopping:
            raw = await _bridge.next_event()
            if raw is None:
                break
            data = raw.to_py()
            event = SimpleNamespace(
                type=data['event']['type'],
                extension=data['extension'],
                target_id=data['targetId'],
                timestamp=data['timeStamp'],
                payload=data['event']['payload']
            )
            for event_type, source, handler in _handlers:
                if _stopping:
                    break
                if event_type != '*' and event.type != event_type:
                    continue
                if (event.extension, event.target_id) != (source.extension, source.targetId):
                    continue
                result = handler(event)
                if inspect.isawaitable(result):
                    await result
    except BaseException as error:
        failure = error
        raise
    finally:
        _stopping = True
        _handlers.clear()
        try:
            await _bridge.close()
        except Exception as cleanup_error:
            if failure is None:
                raise
            failure.add_note(f'Additional event cleanup error: {cleanup_error}')
