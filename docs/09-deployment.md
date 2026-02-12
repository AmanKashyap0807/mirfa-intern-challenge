# 09. Deployment

## Vercel

### The Backend Problem
Vercel is built for Next.js. Deploying a raw Fastify server requires a "Serverless Adapter".
I exported a specific handler in `apps/api/src/index.ts`:

```typescript
export default async (req: any, res: any) => {
  const app = defaultApp ?? createApp().app;
  await app.ready();
  app.server.emit("request", req, res);
};
```
This tricks Vercel into treating our Fastify app like a standard serverless function.

### Environment Config
You **must** set these in the Vercel Dashboard:
1.  `MASTER_KEY`: Access this from your password manager. Do not paste it in Slack.
2.  `MONGODB_URI`: Use MongoDB Atlas. Whitelist `0.0.0.0/0` (standard Vercel dynamic IP issue) or use Vercel Integration.

## CORS
In production, set `ALLOWED_ORIGINS` to `https://your-frontend.vercel.app`.
If you leave it as localhost, the browser will block the frontend from talking to the backend.
