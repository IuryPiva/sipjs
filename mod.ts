import { serve } from "https://deno.land/std@0.114.0/http/server.ts";

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  console.log({ pathname });

  // This is how the server works:
  // 1. A request comes in for a specific asset.
  // 2. We read the asset from the file system.
  // 3. We send the asset back to the client.

  // Check if the request is for index.ts
  if (pathname.startsWith("/index.ts")) {
    // Read the index.ts file from the file system.
    const { files } = await Deno.emit("./index.ts", {
      bundle: "module",
      compilerOptions: { sourceMap: false },
    });

    const [[fileName, file]] = Object.entries(files);

    console.log({ fileName });

    // Respond to the request with the index.ts file.
    return new Response(file, {
      headers: {
        "content-type": "application/javascript",
      },
    });
  }

  return new Response(
    await Deno.readFile("./index.html"),
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

console.log("Listening on http://localhost:8000");
serve(handleRequest);
