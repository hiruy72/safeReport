import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`SafeHer API running on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});
// _rev: 639183612180000000
