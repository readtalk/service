import { createMiddleware } from "react-router";
import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";

export default createMiddleware(async ({ context, request }, next) => {
  const auth = issuer({
    storage: new CloudflareStorage(context.cloudflare.env.AUTH_STORAGE),
    providers: {
      password: {
        verify: async ({ email, password }) => {
          
          const user = await context.cloudflare.env.AUTH_DB.prepare(
            "SELECT * FROM users WHERE email = ? AND password = ?"
          ).bind(email, password).first();
          
          if (!user) return null;
          return { userId: user.id, email: user.email }
        }
      }
    },
    subjects: {
      user: {
        id: "string"
      }
    }
  });

  
  const res = await auth.handleRequest(request); 
  if (res) return res;

  context.auth = auth;
  return next();
});
