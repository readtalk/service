// app/routes/auth/authorize.tsx
import type { Route } from "./+types/authorize";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string() }),
});

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.env as Env;

  // OpenAuth issuer
  const response = await issuer({
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
  }).fetch(request, env, context.ctx);

  return response;
}

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = await env.AUTH_DB.prepare(
    `INSERT INTO user (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();
  if (!result) throw new Error(`Unable to process user: ${email}`);
  return result.id;
}
