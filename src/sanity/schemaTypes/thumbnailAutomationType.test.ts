import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const linkSchema = readFileSync(new URL('./linkType.ts', import.meta.url), 'utf8');
const automationSchema = readFileSync(new URL('./thumbnailAutomationType.ts', import.meta.url), 'utf8');
const schemaIndex = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

test('keeps the existing optional Link thumbnail unchanged', () => {
  assert.match(linkSchema, /defineField\(\{ name: 'thumbnail', title: 'Thumbnail', type: 'image' \}\)/);
  assert.doesNotMatch(linkSchema, /name: 'thumbnail'[^\n]+validation:/);
  assert.doesNotMatch(linkSchema, /name: 'thumbnail'[^\n]+options:/);
});

test('registers optional hidden read-only automation provenance', () => {
  assert.match(linkSchema, /name: 'thumbnailAutomation'[^\n]+type: 'thumbnailAutomation'[^\n]+hidden: true, readOnly: true/);
  assert.doesNotMatch(linkSchema, /name: 'thumbnailAutomation'[^\n]+validation:/);
  assert.match(schemaIndex, /import thumbnailAutomationType from '.\/thumbnailAutomationType'/);
  assert.match(schemaIndex, /homepageSettingsType,\s*thumbnailAutomationType/);
});

test('defines only the approved provenance fields', () => {
  for (const field of ['provider', 'sourceCanonicalUrl', 'fetchedAt', 'assetRef', 'sha256', 'method']) {
    assert.match(automationSchema, new RegExp(`name: '${field}'`));
  }
  assert.doesNotMatch(automationSchema, /accessToken|secret|html|rawBytes|redirect|internalIp/i);
});
