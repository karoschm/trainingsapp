import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
writeFileSync('/tmp/note.png', png);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:4173/');
await page.waitForSelector('.chip');
assert.ok((await page.locator('.chip').count()) >= 12, 'Default-Kategorien');

await page.click('.fab');
await page.fill('input[name=title]', '2-gegen-1 am Kreis');
await page.fill('textarea[name=description]', 'Schnelles Anspiel zum Kreisläufer');
await page.fill('input[name=tags]', 'Kreis, Tempo');
await page.locator('.chip.check', { hasText: 'Angriff' }).click();
await page.setInputFiles('#file', '/tmp/note.png');
await page.waitForSelector('.thumb img');
await page.click('button[type=submit]');
await page.waitForSelector('.detail h1');
assert.equal(await page.locator('.detail img').count(), 1);

await page.goto('http://localhost:4173/#/');
await page.fill('#q', 'kreislaeufer');
assert.equal(await page.locator('.card').count(), 1, 'Suche Beschreibung');
await page.fill('#q', 'TEMPO');
assert.equal(await page.locator('.card').count(), 1, 'Suche Tag');
await page.fill('#q', 'xyz');
assert.equal(await page.locator('.card').count(), 0);
await page.fill('#q', '');
await page.locator('.chip', { hasText: 'Wurf' }).click();
assert.equal(await page.locator('.card').count(), 0, 'Kategorie-Filter');
await page.locator('.chip', { hasText: 'Angriff' }).click();
assert.equal(await page.locator('.card').count(), 1);

await page.reload();
await page.waitForSelector('.card');

// Offline
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await ctx.setOffline(true);
await page.reload();
await page.waitForSelector('.card');
await ctx.setOffline(false);

// Eigene Kategorie
await page.goto('http://localhost:4173/#/categories');
await page.fill('input[name=name]', 'Eigene Kat');
await page.click('#add button');
await page.waitForSelector('text=Eigene Kat');

// Export
await page.goto('http://localhost:4173/#/settings');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exp')]);
await dl.saveAs('/tmp/backup.json');
const data = JSON.parse((await import('node:fs')).readFileSync('/tmp/backup.json', 'utf8'));
assert.equal(data.exercises.length, 1);
assert.equal(data.attachments.length, 1);

// Löschen + Import
await page.goto('http://localhost:4173/#/');
await page.click('.card');
await page.click('#del');
await page.waitForSelector('text=Noch keine Übungen');
await page.goto('http://localhost:4173/#/settings');
await page.setInputFiles('#imp', '/tmp/backup.json');
await page.waitForSelector('.toast');
await page.goto('http://localhost:4173/#/');
await page.waitForSelector('.card');
await page.click('.card');
assert.equal(await page.locator('.detail img').count(), 1, 'Bild nach Import');

assert.deepEqual(errors, []);
console.log('E2E OK');
await browser.close();
