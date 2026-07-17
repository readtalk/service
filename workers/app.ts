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
    const url = new URL(request.url);

    // Redirect root ke /authorize
    if (url.pathname === "/") {
      url.searchParams.set("redirect_uri", url.origin + "/callback");
      url.searchParams.set("client_id", "your-client-id");
      url.searchParams.set("response_type", "code");
      // Tambahkan state agar redirect ke /home setelah login
      url.searchParams.set("state", "/home");
      url.pathname = "/authorize";
      return Response.redirect(url.toString());
    }

    // ============================================================
    // CALLBACK - Diubah dari JSON menjadi REDIRECT
    // ============================================================
    if (url.pathname === "/callback") {
      // Ambil code dan state dari URL
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "/home";

      // Jika tidak ada code, redirect ke halaman login
      if (!code) {
        return Response.redirect("/");
      }

      // Redirect ke halaman yang diminta (state)
      // State ini dibawa dari /authorize
      return Response.redirect(state);
    }

    // OpenAuth issuer
    return issuer({
      storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
      subjects,
      providers: {
        password: PasswordProvider(
          PasswordUI({
            sendCode: async (email, code) => {
              console.log(`Sending code ${code} to ${email}`);
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
        const userId = await getOrCreateUser(env, value.email);
        return ctx.subject("user", { id: userId });
      },
    }).fetch(request, env, ctx);
  },
};

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}
