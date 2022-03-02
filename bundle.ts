export async function bundle() {
  const { files } = await Deno.emit("src/index.ts", {
    // bundle: "module",
    compilerOptions: {
      target: "es2020",
      inlineSourceMap: true,
    },
  });

  for (const [fileName, file] of Object.entries(files)) {
    if (fileName.startsWith("file")) {
      const dest = new URL(fileName).pathname.replace(
        Deno.cwd() + "/src",
        "./dist",
      );

      await Deno.writeTextFile(dest, file);
    }
  }
}

if (import.meta.main) {
  bundle();
}
