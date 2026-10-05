import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMED_FILES, darkColor, stripDarkBlock, withDarkBlock } from '../scripts/dark-theme.js';

const repo = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFile(path.join(repo, file), 'utf8');

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('committed stylesheets carry an up-to-date generated dark theme', async () => {
  for (const file of THEMED_FILES) {
    const css = await read(file);
    assert.equal(css, withDarkBlock(css), `${file}: run npm run theme:dark`);
    assert.match(css, /@media screen and \(prefers-color-scheme: dark\)\{/);
  }
});

test('the dark theme never applies to print and keeps reduced motion untouched', async () => {
  for (const file of THEMED_FILES) {
    const css = await read(file);
    const block = css.slice(stripDarkBlock(css).length);
    assert.doesNotMatch(block, /@media[^{]*print/, file);
    assert.doesNotMatch(block, /animation|transition/, file);
  }
});

test('dark text pairs keep at least WCAG AA contrast', () => {
  const pairs = [
    ['#263d32', '#f7f7ef', 'body ink on paper'],
    ['#5c6e61', '#f7f7ef', 'muted text on paper'],
    ['#5c6e61', '#fffefa', 'muted text on card'],
    ['#ffffff', '#244f3e', 'primary button'],
    ['#624713', '#fff4dc', 'UC grade alert'],
    ['#7e3428', '#fff0eb', 'failed attempt alert'],
    ['#785526', '#f8edda', 'review status chip'],
    ['#7a4f1a', '#fffefa', 'UC outcome on card'],
    ['#2b5670', '#fffefa', 'college outcome on card'],
    ['#244f3e', '#e9efe2', 'diploma outcome on sage'],
  ];
  for (const [text, surface, name] of pairs) {
    const ratio = contrast(darkColor(text, 'color'), darkColor(surface, 'background'));
    assert.ok(ratio >= 4.5, `${name}: ${ratio.toFixed(2)}`);
  }
});

test('dark surfaces are dark, overlays and shadows stay dark', () => {
  for (const surface of ['#ffffff', '#f7f7ef', '#fffefa', '#e9efe2']) assert.ok(luminance(darkColor(surface, 'background')) < 0.03, surface);
  assert.match(darkColor('#132c2573', 'shadow'), /^rgba\(0, 0, 0, /);
  assert.match(darkColor('rgba(38, 61, 50, .06)', 'box-shadow'), /^rgba\(0, 0, 0, /);
});

test('every light color declaration is mirrored so the dark cascade matches', () => {
  const css = '.a{color:#263d32;padding:4px}.b{border:0}@media (min-width:600px){.a{background:white}}@media print{.a{color:black}}';
  const block = withDarkBlock(css).slice(css.length);
  assert.match(block, /\.a\{color: #[0-9a-f]{6}\}/);
  assert.match(block, /\.b\{border: 0\}/);
  assert.match(block, /@media \(min-width:600px\)\{\.a\{background: #[0-9a-f]{6}\}\}/);
  assert.doesNotMatch(block, /padding|print/);
});
