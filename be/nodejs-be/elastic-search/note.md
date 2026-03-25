Before: Both shopdev_es and shopdev_kibana were Exited (137) (killed/OOM) from 6 days ago.

Now: Both are running. docker compose up -d started them with one command.

The reason Kibana can't start at the same time as Elasticsearch is by design — your compose file has:


depends_on:
  elasticsearch:
    condition: service_healthy
This means Kibana waits for ES to pass its healthcheck (curl to port 9200, retrying every 15s up to 20 times) before starting. This is correct behavior — Kibana would crash if it tried connecting to ES before ES is ready.

So docker compose up -d does start everything with one command, just sequentially: ES first, then Kibana after ES is healthy. That's expected and working as intended.

Let me verify they're both running: