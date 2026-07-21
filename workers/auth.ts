import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

export const subjects = createSubjects({
  user: object({ id: string() }),
});

export function createAuth(env: Env) {
  return issuer({
    storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),

    subjects,

    providers: {
      password: PasswordProvider(
        PasswordUI({
          sendCode: async (email, code) => {
            console.log(`[OpenAuth] Kirim code ${code} ke ${email}`);
            // Nanti bisa diganti dengan Resend / MailChannels
          },
          copy: { input_code: "Masukkan kode dari email" },
        })
      ),
    },

    theme: {
      title: "ReadTalk Login",
      primary: "#FF0000",
      favicon: "./favicon.ico",
      logo: {
        dark: "./logo.png",
        light: "./logo.png",
      },
    },

    success: async (ctx, value) => {
      const userId = await getOrCreateUser(env, value.email || "");
      return ctx.subject("user", { id: userId });
    },
  });
}

// Helper untuk D1
async function getOrCreateUser(env: Env, email: string): Promise<string> {
  if (!email) throw new Error("Email required");

  const result = await env.AUTH_DB.prepare(
    `INSERT INTO users (email, created_at) 
     VALUES (?, CURRENT_TIMESTAMP) 
     ON CONFLICT(email) DO UPDATE SET email = email 
     RETURNING id;`
  )
    .bind(email)
    .first<{ id: string }>();

  if (!result?.id) throw new Error("Failed to create user");
  return result.id;
}
