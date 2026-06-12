import { mkdirSync, writeFileSync } from "fs";
import { download } from "./index";

const [user, repo, output] = process.argv.slice(2);

async function main(): Promise<void> {
  if (!user || !repo || !output) {
    console.error("Usage: jdl <user> <repo> <output>");
    process.exit(1);
  }

  const files = await download(user, repo);
  for (const file of await files) {
    if (file.isDir || !file.buffer) {
      continue;
    }
    const filePath = `${output}/${file.path}`;
    const dir = filePath.split("/").slice(0, -1).join("/");
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, file.buffer);
  }

  console.log(`Downloaded to ${output}`);
}

main();
