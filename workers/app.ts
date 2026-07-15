import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

const subjects = createSubjects({
  user: object({ id: string(), email: string() }), 
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    
    if (url.pathname === "/me") {
      const authCheck = issuer({
        storage: CloudflareStorage({ namespace: env.AUTH_STORAGE }),
        subjects,
        providers: { password: PasswordProvider(PasswordUI({ sendCode: async () => {} })) },
      });
      const session = await authCheck.getSession(request, env);
      if (!session) return new Response("Unauthorized", { status: 401 });
      return Response.json(session.subject.user);
    }

    
    if (url.pathname === "/") {
      url.searchParams.set("redirect_uri", "https://readtalk.com/");
      url.searchParams.set("client_id", "your-client-id");
      url.searchParams.set("response_type", "code");
      url.pathname = "/authorize";
      return Response.redirect(url.toString());
    }

    
    if (url.pathname === "/callback") {
      return Response.redirect("https://readtalk.com/");
    }

    
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
        logo: {
          dark: "https://service.readtalk.workers.dev/logo.png",
          light: "https://service.readtalk.workers.dev/logo.png",
        },
      },
      
      success: async (ctx, value) => {
        const userId = await getOrCreateUser(env, value.email);
        const tokens = await ctx.issue(subjects.user, { id: userId, email: value.email });
        
        
        return new Response(null, {
          status: 302,
          headers: {
            "Location": "https://service.readtalk.workers.dev/",
            "Set-Cookie": `token=${tokens.access}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=2592000`
          }
        });
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
