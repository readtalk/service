import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string() }),
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const url = new URL(request.url);

      // Redirect root ke /authorize
      if (url.pathname === "/") {
        url.searchParams.set("redirect_uri", url.origin + "/callback");
        url.searchParams.set("client_id", "your-client-id");
        url.searchParams.set("response_type", "code");
        url.searchParams.set("state", "/home");
        url.pathname = "/authorize";
        return Response.redirect(url.toString());
      }

      // ============================================================
      // CALLBACK DENGAN FIX REDIRECT ABSOLUT
      // ============================================================
      if (url.pathname === "/callback") {
        try {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state") || "/home";

          console.log(`[Callback] code: ${code}, state: ${state}`);

          if (!code) {
            console.error("[Callback] No code provided");
            return new Response(null, {
              status: 302,
              headers: { Location: new URL("/", url.origin).toString() },
            });
          }

          // ============================================================
          // FIX: Gunakan URL absolut
          // ============================================================
          const redirectUrl = new URL(state, url.origin);
          console.log(`[Callback] Redirecting to: ${redirectUrl.toString()}`);

          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl.toString() },
          });
        } catch (callbackError) {
          console.error("[Callback] Error:", callbackError);
          // Fallback ke home
          return new Response(null, {
            status: 302,
            headers: { Location: new URL("/home", url.origin).toString() },
          });
        }
      }

      // OpenAuth issuer
      return issuer({
        storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
        subjects,
        providers: {
          password: PasswordProvider(
            PasswordUI({
              sendCode: async (email, code) => {
                console.log(`[OpenAuth] Sending code ${code} to ${email}`);
              },
              copy: { input_code: "Code (check Worker logs)" },
            }),
          ),
        },
        theme: {
          title: "Authentication",
          primary: "#FF0000",
          favicon: "https://service.readtalk.workers.dev/logo.png",
          logo: { dark: "https://service.readtalk.workers.dev/logo.png", light: "https://service.readtalk.workers.dev/logo.png" },
        },
        success: async (ctx, value) => {
          try {
            const userId = await getOrCreateUser(env, value.email);
            console.log(`[Success] User ${userId} (${value.email})`);
            return ctx.subject("user", { id: userId });
          } catch (successError) {
            console.error("[Success] Error:", successError);
            throw successError;
          }
        },
      }).fetch(request, env, ctx);
    } catch (error) {
      console.error("[Worker] Fatal error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  try {
    const result = await env.AUTH_DB.prepare(
      `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
    )
      .bind(email)
      .first<{ id: string }>();

    if (!result) {
      throw new Error(`Unable to process user: ${email}`);
    }

    console.log(`[DB] User ${result.id} (${email})`);
    return result.id;
  } catch (dbError) {
    console.error("[DB] Error:", dbError);
    throw dbError;
  }
}
