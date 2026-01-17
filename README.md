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

`totalNodes` is the number of nodes/locations in the cluster (typically set via an environment variable each location reads). `gossipPeersPerRound` is how many peers a node gossips to per round, only if it received new data in the prior round (local or neighbor).

```json
{
  "totalNodes": 4,
  "gossipPeersPerRound": 2
}
```

## Gossip behavior

When a node receives `/gossip` and the merge results in a newer timestamp for any entry, it triggers another round of gossip to its peers. If nothing changes, it does not re-gossip.

## High-level flow

```
                 +------------------+
                 |   Client/Script  |
                 | POST /key/save   |
                 +---------+--------+
                           |
                           v
                   +-------+--------+
                   |   Node N       |
                   | local + global |
                   +-------+--------+
                           |
              local update + ts
                           |
                           v
            gossip trigger (if changed)
                           |
                           v
               select random peers
                           |
        +------------------+------------------+
        |                                     |
        v                                     v
+-------+--------+                    +-------+--------+
|   Node A       |                    |   Node B       |
| POST /gossip   |                    | POST /gossip   |
+-------+--------+                    +-------+--------+
        |                                     |
   merge global                            merge global
   compute gossipDelayMs                   compute gossipDelayMs
        |                                     |
        +-------------> if changed, gossip ----+
```

## Running locally

```bash
npm install
npm start
```

Stop the servers with Ctrl+C.

## Local scripts

```bash
./scripts/post_local.sh 2727 5
./scripts/run_traffic.sh
./scripts/run_traffic.sh --help
```
