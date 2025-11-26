- **You do NOT need to set .env variables on the server.**

## Step 5: Verify
Open your browser and visit your VPS IP address (or domain).
- You should see the Lagos Bio-Design Bootcamp landing page.
- Try refreshing the page on a sub-route (e.g., `/workspace`) to ensure Nginx is handling routing correctly.

## Troubleshooting
- **404 on Refresh**: Ensure the `try_files $uri $uri/ /index.html;` line is present in your Nginx config.
- **Blank Page**: Check the browser console (F12) for errors.
