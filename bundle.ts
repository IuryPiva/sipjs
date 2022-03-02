
const { files } = await Deno.emit("index.ts", { bundle: "module" });
for (const [fileName, text] of Object.entries(files)) {
  console.log(`emitted ${fileName} with a length of ${text.length}`);
}
