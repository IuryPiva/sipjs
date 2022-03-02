import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { bundle } from "./bundle.ts";

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  console.log({ pathname });

  // This is how the server works:
  // 1. A request comes in for a specific asset.
  // 2. We read the asset from the file system.
  // 3. We send the asset back to the client.

  if (pathname.endsWith(".ts")) {
    if (!Deno.env.get("DENO_REGION")) {
      await bundle();
    }

    // Respond to the request with the index.ts file.
    return new Response(await Deno.readFile(`./dist/${pathname}.js`), {
      headers: {
        "content-type": "application/javascript",
      },
    });
  }

  return new Response(
    await Deno.readFile("./src/index.html"),
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

console.log("Listening on http://localhost:8000");
serve(handleRequest);
