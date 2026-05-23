import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const version = pkg.version;

let commitHash = "development";
try {
  commitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
} catch {
  // not a git repo or git unavailable
}

const buildTime = new Date().toISOString();

const content = `// Auto-generated — do not edit
export const APP_VERSION = "${version}";
export const COMMIT_HASH = "${commitHash}";
export const BUILD_TIME = "${buildTime}";
`;

writeFileSync("src/lib/version.ts", content, "utf-8");
console.log(`version.ts generated: v${version} (${commitHash})`);
