# Nginx deployment

Run Smart Discount Manager on one Ubuntu/Debian server: nginx terminates TLS, systemd runs Node, PostgreSQL stores discounts and Shopify sessions.

```text
Internet -> nginx :443 (TLS) -> Node (react-router-serve) on 127.0.0.1:3000 -> PostgreSQL / Shopify / SendGrid
Cron (server or your PC) -> POST https://<domain>/api/cron/<job>  (Bearer CRON_SECRET)
```

Replace `discounts.darveys.com` below with your domain.

## 1. Prerequisites

- A domain with an A record pointing at the server. Shopify needs a stable HTTPS URL.
- PostgreSQL (local or managed, e.g. RDS).
- Production values for every variable in [`.env.example`](../.env.example), plus the Shopify ones in step 4.

## 2. Install Node, nginx, certbot (and optionally PostgreSQL)

```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
# Only if the database runs on this server:
sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE USER sdm WITH PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE smart_discount OWNER sdm;"
```

The app needs Node `>=20.19 <22` or `>=22.12`; Node 22 LTS works.

## 3. Get the code and build

```bash
sudo useradd -r -m -d /opt/smart-discount sdm
sudo -u sdm git clone <your-repo-url> /opt/smart-discount/repo
cd /opt/smart-discount/repo/Smart-Discount-Manager
sudo -u sdm npm ci
sudo -u sdm npm run build
```

## 4. Environment file

Create `/etc/smart-discount.env`, then `sudo chown root:sdm /etc/smart-discount.env && sudo chmod 640 /etc/smart-discount.env`:

```ini
NODE_ENV=production
PORT=3000
SHOPIFY_API_KEY=<client_id from shopify.app.toml>
SHOPIFY_API_SECRET=<client secret from the Partner Dashboard>
SHOPIFY_APP_URL=https://discounts.darveys.com
SCOPES=<exactly the scopes string in shopify.app.toml>
DATABASE_URL=postgresql://sdm:change-me@127.0.0.1:5432/smart_discount?schema=public
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@darveys.com
SENDGRID_FROM_NAME="Darveys Rewards"
CRON_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

Run the database migrations once (and after every deploy that adds a migration):

```bash
cd /opt/smart-discount/repo/Smart-Discount-Manager
sudo -u sdm bash -c 'set -a; source /etc/smart-discount.env; npm run setup'
```

## 5. systemd service

`/etc/systemd/system/smart-discount.service`:

```ini
[Unit]
Description=Smart Discount Manager
After=network.target postgresql.service

[Service]
User=sdm
WorkingDirectory=/opt/smart-discount/repo/Smart-Discount-Manager
EnvironmentFile=/etc/smart-discount.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smart-discount
curl -I http://127.0.0.1:3000/   # expect a response from Node
```

Run **one** Node process: the job lock that stops the cron and the admin URL from issuing duplicate vouchers lives in memory.

## 6. nginx

`/etc/nginx/sites-available/smart-discount`:

```nginx
server {
    listen 80;
    server_name discounts.darveys.com;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # The cashback job pages through orders and can take a while.
    location /api/cron/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        # Optional extra lock-down: only allow your server / office IPs.
        # allow 203.0.113.10;
        # deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smart-discount /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d discounts.darveys.com   # adds the 443 block and HTTP->HTTPS redirect
```

## 7. Point Shopify at the server

In `shopify.app.toml` replace every `https://example.com` with `https://discounts.darveys.com`:

- `application_url`
- `[auth] redirect_urls`
- `[app_proxy] url` → `https://discounts.darveys.com/proxy`

Then push the config from your PC: `npm run deploy`. Open the app once from the store admin so it re-authorises (this stores the offline token the cron uses).

## 8. Cron (scheduled jobs)

Two endpoints, both `POST` with `Authorization: Bearer <CRON_SECRET>`:

| Job | URL | Suggested schedule |
| --- | --- | --- |
| Issue cashback vouchers | `/api/cron/process-cashback-rewards` | daily, e.g. 02:00 |
| Expire old discounts | `/api/cron/discount-expiry` | daily, e.g. 03:00 |

Add `?shop=darveys-test.myshopify.com` to run for one store only; without it the job runs for every installed store.

Test by hand:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://discounts.darveys.com/api/cron/process-cashback-rewards
```

**On the server** (`sudo crontab -u sdm -e`):

```cron
0 2 * * * . /etc/smart-discount.env; curl -fsS -m 600 -X POST -H "Authorization: Bearer $CRON_SECRET" https://discounts.darveys.com/api/cron/process-cashback-rewards >> /tmp/sdm-cron.log 2>&1
0 3 * * * . /etc/smart-discount.env; curl -fsS -m 600 -X POST -H "Authorization: Bearer $CRON_SECRET" https://discounts.darveys.com/api/cron/discount-expiry >> /tmp/sdm-cron.log 2>&1
```

**From your Windows PC** (Task Scheduler), create a task that runs daily with:

- Program: `curl.exe`
- Arguments: `-fsS -m 600 -X POST -H "Authorization: Bearer <CRON_SECRET>" https://discounts.darveys.com/api/cron/process-cashback-rewards`

Your PC must be on at the scheduled time, so the server crontab is the safer choice. Vouchers are only issued for orders delivered between `rewardEligibilityDays` and `rewardEligibilityDays + rewardGracePeriodDays` days ago; if the job does not run inside that window, those orders are skipped for good.

The manual admin URLs (`/app/api/process-cashback-rewards`, `/app/api/discount-expiry`) still work and share the same lock.

## 9. Storefront vouchers (App Proxy)

The theme fetches the logged-in customer's vouchers from the store's own domain:

```js
const res = await fetch("/apps/smart-discount/customer-discounts");
// optional: ?collectionId=gid://shopify/Collection/123
const { loggedIn, discounts } = await res.json();
```

Shopify signs the request and adds the logged-in customer, so no customer ID is sent from the browser. Logged-out visitors only get discounts that are open to everyone.

## 10. Updating

```bash
cd /opt/smart-discount/repo && sudo -u sdm git pull
cd Smart-Discount-Manager && sudo -u sdm npm ci && sudo -u sdm npm run build
sudo -u sdm bash -c 'set -a; source /etc/smart-discount.env; npm run setup'
sudo systemctl restart smart-discount
```

Logs: `journalctl -u smart-discount -f`.
