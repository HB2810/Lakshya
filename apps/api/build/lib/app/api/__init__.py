"""HTTP transport layer.

ARCHITECTURE.md §5: "Route handlers perform transport concerns only." Every
authorization decision, invariant and audit write lives in the module services;
routes translate HTTP to a use-case call and back.
"""
