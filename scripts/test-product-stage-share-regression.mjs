import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const url = process.env.ARSENAL_PRODUCT_STAGE_URL ?? 'http://127.0.0.1:5195/#/effect/scroll-pinned-product-stage?config=eyJ2IjoyLCJpZCI6InNjcm9sbC1waW5uZWQtcHJvZHVjdC1zdGFnZSIsInAiOnsidmFyaWFudCI6Im5veC1yZXZlbnVlLW9zIiwic2hvd1ZhcmlhbnRTd2l0Y2hlciI6ZmFsc2UsImNocm9tZSI6Im1pbmltYWwiLCJwYWdlU2Nyb2xsTW9kZSI6dHJ1ZSwiY29tcGFjdFNjcm9sbCI6MC42NiwidmlzdWFsTW9kZSI6InNpZ25hbC1mbG93Iiwic2Nyb2xsUm90YXRpb25FbmFibGVkIjp0cnVlLCJyb3RhdGlvbkF4aXMiOiJ5Iiwicm90YXRpb25UdXJucyI6MC44NSwicm90YXRpb25EaXJlY3Rpb24iOiJjbG9ja3dpc2UiLCJzdGFnZVJvdGF0aW9uSW5mbHVlbmNlIjowLjM1LCJyb3RhdGlvblNtb290aGluZyI6MC4xMiwicGVyc3BlY3RpdmUiOjExMDAsIm9iamVjdFRpbHQiOjYsImdsb3ciOjAuNiwiYmxvb20iOjAuMzUsIm1vYmlsZVJvdGF0aW9uVHVybnMiOjAuMjV9LCJ1c2FnZSI6IkhvbWVwYWdlIFJldmVudWUgT1MgU2VjdGlvbiIsIm5vdGUiOiJSZWZlcmVuemtvbmZpZ3VyYXRpb24gYXVzIGRlbSBEYXNoYm9hcmQifQ';
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('.pps-root').waitFor();
const state = await page.evaluate(() => {
  const root = document.querySelector('.pps-root');
  const product = document.querySelector('.pps-product');
  const scroll = document.querySelector('.pps-scroll');
  const rect = root?.getBoundingClientRect();
  return {
    height: rect?.height ?? 0,
    productVisible: Boolean(product && product.getBoundingClientRect().width > 0 && product.getBoundingClientRect().height > 0),
    text: document.body.innerText,
    before: product?.getAttribute('style') ?? '',
    scrollHeight: scroll?.scrollHeight ?? 0,
  };
});
assert.ok(state.height > 0, 'product stage has no visible height');
assert.ok(state.productVisible, 'product object is not visible');
assert.match(state.text, /NOX|REVENUE/i, 'NOX stage text is missing');
assert.ok(state.scrollHeight > 0, 'preview simulation did not create an internal scroll track');
await page.evaluate(() => { const el = document.querySelector('.pps-scroll'); el.scrollTop = el.scrollHeight; });
await page.waitForTimeout(180);
const after = await page.locator('.pps-product').getAttribute('style');
assert.notEqual(after, state.before, 'rotation did not react to simulated scroll');
assert.deepEqual(errors, [], `runtime errors: ${errors.join('; ')}`);
await browser.close();
console.log('product-stage share regression: OK (visible stage, NOX copy, object, simulated rotation, no runtime error)');
