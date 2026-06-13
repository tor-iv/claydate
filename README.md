# ClayDate

A pottery meetup calendar for the friends of Slo Slo Studio. Create meetups, RSVP, leave comments, and share photos from the kiln room.

Built with Next.js 16, SQLite (better-sqlite3 + Drizzle), Tailwind v4, and iron-session. No cloud dependencies — just a single container and a volume.

---

## Local dev

```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm seed      # seed the database with sample meetups and users
```

---

## Deploy

ClayDate runs as a single Docker container on a Hetzner VPS. A GitHub Actions workflow auto-deploys on every push to `main`.

### First-time server setup

```bash
# On the server
git clone <repo> /opt/claydate
cd /opt/claydate
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env   # keep this safe
docker compose --env-file .env up -d --build
```

### Auto-deploy (GitHub Actions)

Push to `main` → the workflow SSHes into the server and runs `docker compose up -d --build`.

Configure two repository secrets in **Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `HETZNER_IP` | Public IPv4 of the server |
| `SSH_PRIVATE_KEY` | Private key (public half must be in server's `authorized_keys`) |

---

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `SESSION_SECRET` | — | **Required in production.** Must be ≥ 32 characters. |
| `DB_PATH` | `./data/claydate.db` | Path to SQLite database file. |
| `DATA_DIR` | `./data/uploads` | Directory for uploaded photos. |
| `HTTPS` | unset | Set to `"true"` only if serving over HTTPS (enables secure cookies). |

Both `DB_PATH` and `DATA_DIR` are created automatically on startup. In production these live in the `claydata` Docker volume mounted at `/app/data`.
