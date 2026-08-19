"""In-process fixed-window rate limiter for authentication endpoints.

SECURITY.md §10: "Limits should use a shared store when horizontally scaled; a
database-backed/simple gateway limiter is acceptable initially."

LIMITATION (documented, not a defect): this limiter is per-process. Running more
than one API replica multiplies the effective limit. A shared store (or gateway
limiter) is required before the API is scaled horizontally.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict, deque
from dataclasses import dataclass


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int


class FixedWindowRateLimiter:
    """Allow at most ``max_attempts`` per ``window_seconds`` per key."""

    def __init__(
        self, *, max_attempts: int, window_seconds: int, max_tracked_keys: int = 10_000
    ) -> None:
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds
        # Insertion-ordered so the oldest-touched key can be evicted in O(1).
        self._hits: OrderedDict[str, deque[float]] = OrderedDict()
        self._lock = threading.Lock()
        # Hard memory bound. An attacker rotating source addresses or account
        # names must not be able to grow this map without limit — that would turn
        # a rate limiter into a memory-exhaustion vector.
        #
        # LIMITATION: because the bound is enforced by eviction, an attacker who
        # churns more than ``max_tracked_keys`` distinct keys can evict their own
        # counter and reset their limit. The cost of doing so is high relative to
        # the benefit, and the real fix is the shared store noted in the module
        # docstring; the memory bound is not negotiable, so eviction wins.
        self._max_tracked_keys = max_tracked_keys

    def check(self, key: str) -> RateLimitDecision:
        """Record an attempt for ``key`` and report whether it is allowed."""
        now = time.monotonic()
        cutoff = now - self._window_seconds

        with self._lock:
            bucket = self._hits.get(key)
            if bucket is None:
                self._prune(cutoff)
                self._evict_to_capacity()
                bucket = deque()
                self._hits[key] = bucket
            else:
                # Mark as recently used so active keys survive eviction.
                self._hits.move_to_end(key)

            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= self._max_attempts:
                retry_after = max(1, int(bucket[0] + self._window_seconds - now) + 1)
                return RateLimitDecision(allowed=False, retry_after_seconds=retry_after)

            bucket.append(now)
            return RateLimitDecision(allowed=True, retry_after_seconds=0)

    def reset(self, key: str) -> None:
        """Forget a key. Called after a successful authentication."""
        with self._lock:
            self._hits.pop(key, None)

    def clear(self) -> None:
        """Drop all state. Used by tests."""
        with self._lock:
            self._hits.clear()

    @property
    def tracked_key_count(self) -> int:
        """Number of keys currently held. Exposed so the memory bound is testable."""
        with self._lock:
            return len(self._hits)

    def _prune(self, cutoff: float) -> None:
        """Drop keys whose window has fully expired. Caller holds the lock."""
        stale = [key for key, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
        for key in stale:
            del self._hits[key]

    def _evict_to_capacity(self) -> None:
        """Evict oldest-touched keys until there is room. Caller holds the lock.

        Runs after :meth:`_prune`, so expired keys go first and eviction only
        happens when the map is genuinely full of live counters.
        """
        while len(self._hits) >= self._max_tracked_keys:
            self._hits.popitem(last=False)
