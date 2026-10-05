import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const ownerName = '.openpath-dist-owner';
const ownerValue = 'OpenPath generated dist v1\n';

// This is a public-asset allowlist, never a recursive project copy.
export const PUBLIC_ASSETS = Object.freeze([
  ['index.html', 'index.html'],
  ['src/app.js', 'src/app.js'],
  ['src/data.js', 'src/data.js'],
  ['src/catalog.js', 'src/catalog.js'],
  ['src/custom-courses.js', 'src/custom-courses.js'],
  ['src/ousd-schedule.js', 'src/ousd-schedule.js'],
  ['src/state.js', 'src/state.js'],
  ['src/rules.js', 'src/rules.js'],
  ['src/judgment.js', 'src/judgment.js'],
  ['src/journey.js', 'src/journey.js'],
  ['src/guide.js', 'src/guide.js'],
  ['src/high-school.js', 'src/high-school.js'],
  ['src/high-school-view.js', 'src/high-school-view.js'],
  ['src/high-school-export.js', 'src/high-school-export.js'],
  ['src/course-record.js', 'src/course-record.js'],
  ['src/custom-course-view.js', 'src/custom-course-view.js'],
  ['src/course-workflow-view.js', 'src/course-workflow-view.js'],
  ['src/school-roster.js', 'src/school-roster.js'],
  ['src/styles.css', 'src/styles.css'],
  ['src/guide.css', 'src/guide.css'],
  ['src/high-school.css', 'src/high-school.css'],
  ['public/_headers', '_headers'],
]);

const dirIdentity = info => `${info.dev}:${info.ino}:${Math.round(info.birthtimeMs)}\n`;

async function statIfPresent(file) {
  try { return await lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function safeSource(root, relative) {
  const parts = relative.split('/');
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`Refusing symlink in public asset: ${relative}`);
    const expected = index === parts.length - 1 ? info.isFile() : info.isDirectory();
    if (!expected) throw new Error(`Invalid public asset path: ${relative}`);
  }
  return readFile(current);
}

export async function build(root = projectRoot) {
  root = path.resolve(root);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('Build root must be a real directory');
  const output = path.join(root, 'dist');
  const ownerFile = path.join(root, ownerName);
  const outputInfo = await statIfPresent(output);
  const ownerInfo = await statIfPresent(ownerFile);
  if (outputInfo?.isSymbolicLink() || (outputInfo && !outputInfo.isDirectory())) {
    throw new Error('Refusing non-directory or symlink dist');
  }
  if (ownerInfo && (!ownerInfo.isFile() || ownerInfo.isSymbolicLink())) throw new Error('Invalid dist ownership marker');
  // The marker names the exact dist directory this script created. A dist someone
  // recreated by hand (new identity) is not ours, even if an old marker survived.
  const marker = ownerInfo ? await readFile(ownerFile, 'utf8') : null;
  const knownMarker = marker != null && (marker === ownerValue || marker.startsWith(ownerValue));
  if (ownerInfo && !knownMarker) throw new Error('Unknown dist ownership marker');
  if (outputInfo) {
    if (!knownMarker) throw new Error('Refusing to replace an unowned dist directory');
    if (marker === ownerValue) throw new Error('Refusing to replace dist: legacy ownership marker cannot prove dist was generated. Remove dist/ and rebuild.');
    if (marker !== ownerValue + dirIdentity(outputInfo)) throw new Error('Refusing to replace an unowned dist directory (it was recreated after the last build)');
  }

  // Validate and read every source before replacing any generated files.
  const content = await Promise.all(PUBLIC_ASSETS.map(async ([source, target]) => [target, await safeSource(root, source)]));
  if (outputInfo) await rm(output, { recursive: true });
  await mkdir(output);
  await writeFile(ownerFile, ownerValue + dirIdentity(await lstat(output)));
  for (const [relative, body] of content) {
    const destination = path.join(output, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, body);
  }
  return { output, files: content.map(([relative]) => relative) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Built ${result.files.length} allowlisted public files into ${result.output}`);
}
