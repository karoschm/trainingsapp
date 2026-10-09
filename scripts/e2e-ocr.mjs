import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });

// Testbild mit deutschem Text erzeugen
const gen = await ctx.newPage();
await gen.setContent('<body style="margin:0;background:#fff"><div id=t style="font:bold 48px Arial;padding:40px;width:900px;color:#000">Torwart Training<br>Übung für Außenspieler<br>Kreisläufer Anspiel</div></body>');
await gen.locator('#t').screenshot({ path: '/tmp/ocr-note.png' });

const page = await ctx.newPage();
const reqs = [];
page.on('request', (r) => reqs.push(r.url()));
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:4173/#/edit');
await page.fill('input[name=title]', 'OCR Test');
await page.setInputFiles('#file', '/tmp/ocr-note.png');
await page.waitForSelector('.thumb img');
await page.click('.ocr');
await page.waitForFunction(() => document.querySelector('#ocrText').value.length > 10, null, { timeout: 120000 });
const text = await page.inputValue('#ocrText');
console.log('Erkannt:\n' + text);
assert.match(text, /Torwart/i);
assert.match(text, /Kreisl/i);
const isLocal = (u) => /^(http:\/\/localhost:4173|blob:|data:)/.test(u);
assert.ok(reqs.every(isLocal), 'Keine externen Requests: ' + reqs.filter((u) => !isLocal(u)).join(','));

await page.click('button[type=submit]');
await page.waitForSelector('.ocr-text');
await page.goto('http://localhost:4173/#/');
await page.fill('#q', 'kreislaeufer');
assert.equal(await page.locator('.card').count(), 1, 'Suche findet OCR-Text');
console.log('OCR E2E OK');
await browser.close();
