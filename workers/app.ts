import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { createAuth } from "./auth";

const app = new Hono();

// === OpenAuth Routes ===
const authApp = createAuth();
app.route("/auth", authApp);

// === React Router ===
app.get("*", (c) => {
    const requestHandler = createRequestHandler(
        () => import("virtual:react-router/server-build"),
        import.meta.env.MODE,
    );

    return requestHandler(c.req.raw, {
        cloudflare: { env: c.env, ctx: c.executionCtx },
    });
});

export default app;
