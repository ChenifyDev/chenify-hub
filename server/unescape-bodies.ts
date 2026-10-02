import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PUNCT = "[\\\\`*_{}[\\]()#+\\-.!>~|&]";
const ESCAPE_RUN = new RegExp(`\\\\+(?=${PUNCT})`, "g");
const ENTITIES: [RegExp, string][] = [
    [/&gt;/g, ">"],
    [/&lt;/g, "<"],
    [/&quot;/g, '"'],
    [/&#39;/g, "'"],
    [/&nbsp;/g, " "],
    [/&amp;/g, "&"],
];

const dir = path.resolve(import.meta.dir, "..", "uploads");

const EMPTY_IMAGE = /^[ \t]*!\[[^\]]*\]\([ \t]*\)[ \t]*\r?\n?/gm;

const removeLayer = (s: string) => s.replace(ESCAPE_RUN, (run) => run.slice(1));

const decode = (s: string) => ENTITIES.reduce((acc, [re, to]) => acc.replace(re, to), s);

const repair = (raw: string) => {
    const text = raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
    const undone = removeLayer(removeLayer(decode(text)));
    return undone
        .replace(EMPTY_IMAGE, "")
        .replace(/\n{2,}(?=[ \t]*[|:])/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trimEnd()
        .concat("\n");
};

if (!existsSync(dir)) {
    console.error(`找不到 uploads 目录：${dir}`);
    process.exit(1);
}

const damaged = (s: string) =>
    /&(gt|lt|quot|#39|nbsp|amp);/.test(s) ||
    s.includes("\r\n") ||
    s.includes("\u00a0") ||
    /!\[[^\]]*\]\([ \t]*\)/.test(s);

for (const name of readdirSync(dir).filter((file) => file.endsWith(".txt"))) {
    const file = path.join(dir, name);
    const backup = `${file}.bak`;
    const source = existsSync(backup) ? readFileSync(backup, "utf8") : readFileSync(file, "utf8");
    if (!damaged(source)) {
        console.log("跳过（无损坏签名）", name);
        continue;
    }
    const after = repair(source);
    if (!existsSync(backup)) writeFileSync(backup, source);
    writeFileSync(file, after);
    console.log(
        "已修复",
        name,
        `反斜杠 ${source.split("\\").length - 1} -> ${after.split("\\").length - 1}`,
        `实体 ${source.length - source.replace(/&(gt|lt|quot|#39|nbsp|amp);/g, "").length} -> 0`,
        `字节 ${source.length} -> ${after.length}`,
    );
}
