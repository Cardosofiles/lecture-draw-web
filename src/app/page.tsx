import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * The root is a dispatcher. It must never send a signed-in visitor to /login:
 * proxy.ts bounces them straight back here and the browser ping-pongs until
 * ERR_TOO_MANY_REDIRECTS.
 */
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session ? "/dashboard" : "/login");
}
