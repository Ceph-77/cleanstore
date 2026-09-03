import { app } from "./app";
import { env } from "./config/env";
import { startScheduler } from "./scheduler";

app.listen(env.PORT, () => {
  console.log(`CleanStore backend listening on http://localhost:${env.PORT}`);
  startScheduler();
});
