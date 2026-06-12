const HOST = "https://cdn.jsdelivr.net";

export async function downloadBinary(url: string): Promise<Uint8Array> {
  const buf = await fetch(url).then((resp) => resp.arrayBuffer());
  return new Uint8Array(buf);
}

export type GhFile = {
  url: string;
  path: string;
  name: string;
  isDir: boolean;
  buffer?: Uint8Array;
};

async function parse(html: string): Promise<GhFile[]> {
  const table = getTable(html);
  if (!table) {
    return [];
  }

  const regex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const v: GhFile[] = [];

  for (const i of Array.from(
    table.matchAll(regex),
    ([, url, name]): GhFile => {
      const isDir = url.endsWith("/");
      const path = url.split("/").slice(4).join("/");
      return {
        path,
        url: HOST + url,
        name,
        isDir,
      };
    }
  )) {
    if (!i.isDir) {
      i.buffer = await downloadBinary(i.url);
    }
    if (i.name !== "...") {
      v.push(i);
    }
  }

  return v;
}

function getTable(html: string): string | null {
  const regex = /<table[^>]*>([\s\S]*?)<\/table>/i;
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

async function getFiles(
  user: string,
  repo: string,
  url: string
): Promise<GhFile[]> {
  const html = await fetch(url).then((resp) => resp.text());
  const files = await parse(html);
  const v: GhFile[] = [];

  for (const file of files) {
    if (file.isDir) {
      const subUrl = url + file.path;
      const subFiles = await getFiles(user, repo, subUrl);
      for (const k of subFiles) {
        v.push(k);
      }
    } else {
      v.push(file);
    }
  }

  return v;
}

export function download(user: string, repo: string): Promise<GhFile[]> {
  const url = HOST + `/gh/${user}/${repo}/`;
  const files = getFiles(user, repo, url);
  return files;
}
