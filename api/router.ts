import { authRouter } from "./auth-router";
import { emailAuthRouter } from "./email-auth-router";
import { nutriaRouter } from "./nutria-router";
import { aiRouter } from "./ai-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  emailAuth: emailAuthRouter,
  nutria: nutriaRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
