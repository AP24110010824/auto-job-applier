const puppeteer = require('puppeteer');

// Simple regex to extract email from text
const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

let globalBrowser = null;

async function runScraper(username, password, keywords) {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: false, // Keep it visible for now so we can debug, linkedin often asks for captchas
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });
    globalBrowser = browser;

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Some basic stealth configs
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        // 1. Go to LinkedIn login page
        console.log("Navigating to LinkedIn login...");
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        // 2. Login
        console.log("Waiting for username field...");
        await page.waitForSelector('#username', { timeout: 15000 });
        console.log("Typing username...");
        await page.type('#username', username, { delay: 100 });
        
        console.log("Typing password...");
        await page.waitForSelector('#password', { timeout: 15000 });
        await page.type('#password', password, { delay: 100 });
        
        console.log("Submitting login form...");
        await page.keyboard.press('Enter');
        
        console.log("Logging in... waiting to load the feed.");
        // Instead of waitForNavigation which often times out on SPAs, we wait for a specific element
        // or just wait for a fixed amount of time since we are in headful mode and user might need to solve captcha.
        // We'll wait up to 60 seconds for the search input to appear, which indicates a successful login.
        try {
             await page.waitForSelector('.search-global-typeahead__input', { timeout: 60000 });
             console.log("Login successful, feed loaded!");
        } catch (e) {
             console.log("Could not find search bar, waiting an extra 10 seconds just in case...");
             await new Promise(r => setTimeout(r, 10000));
        }

        // 3. Construct Search URL
        // Search in "Posts" (origin=FACETED_SEARCH&searchId=... )
        // Using keywords: "JAVA DEVELOPER" AND "CONTRACT"
        const encodedKeywords = encodeURIComponent(keywords);
        
        // datePosted="past-24h" filter in LinkedIn URL is usually done via facet params but the simplest 
        // way is to search the keyword and then apply the "Posts" and "Past 24 hours" filter.
        // The query string for "Posts" and "Past 24 hours":
        // &keywords=JAVA%20DEVELOPER%20CONTRACT&origin=GLOBAL_SEARCH_HEADER
        
        const searchUrl = `https://www.linkedin.com/search/results/content/?datePosted=%22past-24h%22&keywords=${encodedKeywords}&origin=FACETED_SEARCH`;
        console.log(`Navigating to search URL: ${searchUrl}`);
        
        // Removed networkidle2 here, as search page has too many background requests and times out
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 8000)); // wait for results to visibly render

        // Scroll down to load more posts
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(r => setTimeout(r, 2000));
        }

        // 4. Extract Posts content and look for emails
        console.log("Extracting posts...");
        const extractedJobs = [];
        
        // Try to get post content elements. 
        // LinkedIn CSS classes change often. We will try multiple common classes for post text in search results.
        const postsText = await page.$$eval('.update-components-text, .feed-shared-update-v2__description, .feed-shared-update-v2__commentary, .break-words, span[dir="ltr"]', elements => {
            return elements.map(el => el.innerText || el.textContent);
        });

        // Fallback: if we still found 0, let's just grab the whole page text so we at least find the emails.
        if (postsText.length === 0) {
            console.log("Specific post selectors failed. Grabbing entire page text as fallback...");
            const bodyText = await page.evaluate(() => document.body.innerText);
            postsText.push(bodyText);
        }

        console.log(`Scanned ${postsText.length} text elements in posts.`);

        for (const text of postsText) {
            if (text && text.length > 20) {
                const emailsFound = text.match(emailRegex);
                if (emailsFound) {
                    for (const email of emailsFound) {
                        // Prevent duplicates and false positives
                        if (!extractedJobs.some(j => j.email.toLowerCase() === email.toLowerCase()) && !email.toLowerCase().includes('sentry') && !email.toLowerCase().includes('.png')) {
                            extractedJobs.push({
                                email: email,
                                textSnippet: text.substring(0, 150) + "..."
                            });
                        }
                    }
                }
            }
        }

        console.log(`Found ${extractedJobs.length} unique recruiter emails.`);
        return extractedJobs;

    } catch (error) {
        console.error("Scraping error:", error);
        return [];
    } finally {
        // Keep browser open if you want to see what happened, otherwise close it.
        // await browser.close();
    }
}

async function stopScraper() {
    if (globalBrowser) {
        console.log("Stopping bot. Closing browser...");
        await globalBrowser.close();
        globalBrowser = null;
        return true;
    }
    return false;
}

module.exports = { runScraper, stopScraper };
