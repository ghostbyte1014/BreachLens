# Free security-check service

This small free Cloudflare service keeps optional security-service passwords out of the website. It powers the Threat Intelligence page.

## Set it up

1. Create a free Cloudflare account and install its command-line tool: `npm install -g wrangler`.
2. In this project folder, sign in and publish the service: `wrangler login`, then `wrangler deploy`.
3. Add the free keys for the checks you want to use:

   ```text
   wrangler secret put VIRUSTOTAL_API_KEY
   wrangler secret put ABUSEIPDB_API_KEY
   wrangler secret put URLSCAN_API_KEY
   # Optional: lets the CVE search make more requests
   wrangler secret put NVD_API_KEY
   ```

4. When you build the website, set `VITE_SECURITY_API_BASE` to your Worker address followed by `/api`.

The domain and CVE checks work without a key. The other checks appear as “not set up” until you add their free key. Never add these keys to a `VITE_` setting because visitors could see them.
