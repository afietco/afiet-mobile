import { readFile } from "node:fs/promises";

const MOBILE_PACKAGE_PATH = new URL("../apps/mobile/package.json", import.meta.url);
const APP_CONFIG_PATH = new URL("../apps/mobile/app.json", import.meta.url);
const LOCKFILE_PATH = new URL("../package-lock.json", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const [mobilePackage, appConfig, lockfile] = await Promise.all([
  readJson(MOBILE_PACKAGE_PATH),
  readJson(APP_CONFIG_PATH),
  readJson(LOCKFILE_PATH),
]);

const versions = {
  "apps/mobile/package.json": mobilePackage.version,
  "apps/mobile/app.json": appConfig.expo?.version,
  "package-lock.json": lockfile.packages?.["apps/mobile"]?.version,
};

const missingSources = Object.entries(versions)
  .filter(([, version]) => typeof version !== "string" || version.length === 0)
  .map(([source]) => source);

if (missingSources.length > 0) {
  throw new Error(`Missing mobile version in: ${missingSources.join(", ")}`);
}

const uniqueVersions = new Set(Object.values(versions));

if (uniqueVersions.size !== 1) {
  const details = Object.entries(versions)
    .map(([source, version]) => `${source}=${version}`)
    .join(", ");
  throw new Error(`Mobile versions do not match: ${details}`);
}

const [version] = uniqueVersions;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Mobile version must use X.Y.Z format: ${version}`);
}

console.log(`Mobile version verified: ${version}`);
