#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const HELP = `
Usage:
  node scripts/extract-panoee-images.mjs <panoee-url...> [options]
  node scripts/extract-panoee-images.mjs --file urls.txt [options]

Options:
  --file <path>       Read Panoee URLs from a text file, one URL per line.
  --format <format>   Output format: table, json, csv, js. Default: table.
  --out <path>        Write output to a file instead of stdout.
  --all-scenes        Output every scene found in each tour page.
  --help              Show this help.

Examples:
  node scripts/extract-panoee-images.mjs https://tour.panoee.net/TOUR/k-thuvien
  node scripts/extract-panoee-images.mjs --file panoee-urls.txt --format js
  node scripts/extract-panoee-images.mjs --file panoee-urls.txt --format csv --out panoee-images.csv
`;

const args = process.argv.slice(2);

for (let index = 0; index < args.length - 1; index += 1) {
  if (args[index] === "--" && ["file", "format", "out", "all-scenes", "help"].includes(args[index + 1])) {
    args.splice(index, 2, `--${args[index + 1]}`);
  }
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP.trim());
  process.exit(0);
}

function takeOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  args.splice(index, 2);
  return value;
}

let filePath = takeOption("--file");
const format = takeOption("--format") ?? "table";
const outPath = takeOption("--out");
const allScenes = args.includes("--all-scenes");
const positionalArgs = args.filter((arg) => arg !== "--all-scenes");

if (!filePath && positionalArgs.length === 1 && !/^https?:\/\//i.test(positionalArgs[0])) {
  filePath = positionalArgs.shift();
}

const urlsFromArgs = positionalArgs;

if (!["table", "json", "csv", "js"].includes(format)) {
  throw new Error(`Unsupported format "${format}". Use table, json, csv, or js.`);
}

const urlsFromFile = filePath
  ? (await readFile(filePath, "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  : [];

const urls = [...urlsFromFile, ...urlsFromArgs];

if (urls.length === 0) {
  console.error(HELP.trim());
  process.exit(1);
}

function getRequestedSlug(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  return parts.length >= 2 ? parts.at(-1) : null;
}

function findNextData(html) {
  const match = html.match(
    /<script\s+id=["']__NEXT_DATA__["']\s+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) {
    throw new Error("Could not find __NEXT_DATA__ in page HTML.");
  }
  return JSON.parse(match[1]);
}

function sceneToRow(pageUrl, scene) {
  return {
    pageUrl,
    title: scene.title ?? "",
    slug: scene.slug ?? "",
    src: scene.media?.src ?? "",
    preview: scene.media?.src_preview ?? "",
    thumb: scene.media?.src_thumb ?? "",
    mimetype: scene.media?.mimetype ?? "",
    size: scene.media?.size ?? null,
  };
}

function selectScenes(pageUrl, scenes) {
  if (allScenes) return scenes;

  const requestedSlug = getRequestedSlug(pageUrl);
  if (!requestedSlug) return scenes;

  const exact = scenes.filter((scene) => scene.slug === requestedSlug);
  if (exact.length === 0) {
    const available = scenes.map((scene) => scene.slug).filter(Boolean).join(", ");
    throw new Error(`Scene "${requestedSlug}" was not found. Available scenes: ${available || "none"}`);
  }

  return exact;
}

async function fetchRows(pageUrl) {
  const response = await fetch(pageUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 Panoee image extractor",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const data = findNextData(html);
  const app = data?.props?.pageProps?.initialState?.app;
  const scenes = app?.listScene ?? app?.project?.scenes ?? [];

  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error("No scenes found in Panoee page data.");
  }

  return selectScenes(pageUrl, scenes).map((scene) => sceneToRow(pageUrl, scene));
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toKey(slug) {
  return slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function renderTable(rows) {
  return rows
    .map((row) => {
      if (row.error) {
        return [`URL: ${row.pageUrl}`, `Error: ${row.error}`].join("\n");
      }

      const size = row.size == null ? "unknown" : `${Math.round(row.size / 1024)} KB`;
      return [
        `Scene: ${row.slug || row.title}`,
        `Image: ${row.src}`,
        `Size: ${size}`,
        `Type: ${row.mimetype || "unknown"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function renderCsv(rows) {
  const columns = ["pageUrl", "title", "slug", "src", "preview", "thumb", "mimetype", "size"];
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")),
  ].join("\n");
}

function renderJs(rows) {
  return rows
    .map((row) => {
      if (row.error) {
        return `  // ${row.pageUrl}: ${row.error}`;
      }

      const key = toKey(row.slug || row.title);
      return `  ${key}: "${row.src}",`;
    })
    .join("\n");
}

const results = [];

for (const url of urls) {
  try {
    results.push(...(await fetchRows(url)));
  } catch (error) {
    results.push({
      pageUrl: url,
      title: "",
      slug: "",
      src: "",
      preview: "",
      thumb: "",
      mimetype: "",
      size: null,
      error: error.message,
    });
  }
}

const output =
  format === "json"
    ? JSON.stringify(results, null, 2)
    : format === "csv"
      ? renderCsv(results)
      : format === "js"
        ? renderJs(results)
        : renderTable(results);

if (outPath) {
  await writeFile(outPath, `${output}\n`, "utf8");
} else {
  console.log(output);
}
