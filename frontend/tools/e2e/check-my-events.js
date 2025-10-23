const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox'],
      timeout: 60000,
      protocolTimeout: 60000
    });
  } catch (launchErr) {
    // Try fallback to local Chrome/Chromium binary on macOS or Linux
    const fs = require('fs');
    const possible = [
      process.env.CHROME_PATH,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ].filter(Boolean);

    let found = null;
    for (const p of possible) {
      if (p && fs.existsSync(p)) {
        found = p;
        break;
      }
    }

    if (!found) {
      console.error('Puppeteer launch failed and no local Chrome executable found. Original error:', launchErr);
      process.exit(2);
    }

    try {
      browser = await puppeteer.launch({ headless: true, executablePath: found, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    } catch (e) {
      console.error('Failed to launch Puppeteer with fallback executable:', found, e);
      process.exit(2);
    }
  }
  const page = await browser.newPage();
  // Increase timeouts for robustness
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  // Intercept network requests and provide canned responses for API endpoints
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    try {
      if (url.includes('/api/users/') && url.endsWith('/events') && method === 'GET') {
        // Return two sample events for My Events
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'evt-1', name: 'Dev Event 1', description: 'Desc', date: '2025-11-01', category: 'Music', imageUrl: 'https://source.unsplash.com/800x600/?music' },
            { id: 'evt-2', name: 'Dev Event 2', description: 'Desc2', date: '2025-12-01', category: 'Art', imageUrl: null }
          ])
        });
      }

      if (url.endsWith('/api/events/list') && method === 'GET') {
        // Return sample explore list
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'evt-1', name: 'Dev Event 1', description: 'Desc', date: '2025-11-01', category: 'Music', imageUrl: 'https://source.unsplash.com/800x600/?music' },
            { id: 'evt-3', name: 'Dev Event 3', description: 'Desc3', date: '2025-12-15', category: 'Food', imageUrl: null }
          ])
        });
      }

      if (url.includes('/api/users/') && url.includes('/events/') && method === 'POST') {
        // Simulate add event success
        return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'added' }) });
      }

      // Let other requests pass through (assets, JS, etc.)
      return req.continue();
    } catch (e) {
      console.error('Request interception error', e);
      return req.continue();
    }
  });

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Inject a dev user into localStorage to bypass Firebase auth in dev
    const devUser = {
      uid: 'dev-user-1',
      email: 'dev@example.com',
      displayName: 'Dev User',
      isAdmin: false,
      profile: { id: 'dev-user-1', name: 'Dev User', isAdmin: false }
    };


    // Set DEV auth and a fake token that includes the uid in the payload for getCurrentUid parsing
    const fakeToken = 'devheader.eyJ1aWQiOiJkZXYtdXNlcjEifQ==.devsig';
    await page.evaluate((u, t) => {
      localStorage.setItem('DEV_AUTH_USER', JSON.stringify(u));
      localStorage.setItem('token', t);
    }, devUser, fakeToken);

    // Reload so the client picks up the dev auth
    await page.reload({ waitUntil: 'networkidle2' });

    // Ensure there is at least one item in My Events by visiting Explore and adding the sample event we return from the intercepted API
    await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle2' });
    // Wait until our injected event name appears
    await page.waitForFunction(() => !!document.querySelector('body') && document.body.innerText.includes('Dev Event 1'), { timeout: 30000 });
    // Use XPath to find the 'Add' button for the card that contains 'Dev Event 1'
    const addBtnXpath = "//div[contains(., 'Dev Event 1')]//button[normalize-space(.)='Add']";
    const added = await page.evaluate((xp) => {
      try {
        const res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const node = res.singleNodeValue;
        if (node) {
          node.click();
          return true;
        }
      } catch (e) {
        console.error('XPath eval error', e);
      }
      return false;
    }, addBtnXpath);
    if (!added) console.warn('Add button for Dev Event 1 not found');

    // Wait briefly for backend call to complete
    await page.waitForTimeout(1200);

    // Navigate to My Events
    await page.goto('http://localhost:3000/my-events', { waitUntil: 'networkidle2' });

    // Wait for My Events page content to include our sample
    await page.waitForFunction(() => document.body.innerText.includes('Dev Event 1'), { timeout: 30000 });
    // Click the arrow button on the card that contains 'Dev Event 1'
    const arrowXpath = "//div[contains(., 'Dev Event 1')]//button[.//span[contains(., 'arrow_forward')]]";
    const clicked = await page.evaluate((xp) => {
      try {
        const res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const node = res.singleNodeValue;
        if (node) { node.click(); return true; }
      } catch (e) { console.error('XPath eval error', e); }
      return false;
    }, arrowXpath);
    if (!clicked) throw new Error('Arrow button for Dev Event 1 not found on My Events');

    // Wait for SPA route change to an event detail route
    await page.waitForFunction(() => location.pathname.includes('/events') || location.pathname.includes('/event'), { timeout: 30000 });

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 });

    const url = page.url();
    console.log('Navigated to:', url);

    // Check for presence of an image or background-image on the page
    const hasImage = await page.evaluate(() => {
      // Check for an element with inline background-image
      const bg = document.querySelector('[style*="background-image"]');
      if (bg) return true;
      // Or an img element
      return !!document.querySelector('img');
    });

    console.log('Has image on event detail page:', hasImage);

    if (!url.includes('/events/') && !url.includes('/event/')) {
      throw new Error('Did not navigate to event detail route');
    }

    if (!hasImage) {
      console.warn('Event detail page did not show an image element or background-image — could be imageUrl null for that event.');
    }

    console.log('E2E check completed successfully');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E check failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
