# transient

Distributed, eventually consistent key-value store with local and global values per location; global values are derived from local values across locations.

## API

`transient.tespeedo.com/key/save`

```json
{
  "local": "...",
  "global": "..."
}
```

Example shape (global aggregates locals by node id, each with value + timestamp):

```json
{
  "local": { "value": 5, "ts": "2026-01-16T12:00:00Z" },
  "global": {
    "0": { "value": 5, "ts": "2026-01-16T12:00:00Z" },
    "1": { "value": 9, "ts": "2026-01-16T12:00:03Z" },
    "2": { "value": 10, "ts": "2026-01-16T12:00:04Z" },
    "3": { "value": 15, "ts": "2026-01-16T12:00:05Z" }
  }
}
```

## Config

`nodeCount` is the number of nodes/locations in the cluster (typically set via an environment variable each location reads).

```json
{
  "nodeCount": 4
}
```
