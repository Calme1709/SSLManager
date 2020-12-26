import { Browser, launch } from "puppeteer";

let browser: Promise<Browser> | undefined;

/**
 * Get a puppeteer browser instance.
 *
 * @returns The browser instance.
 */
export default async () => {
	if(browser === undefined) {
		browser = launch({ headless: false });
	}

	return browser;
};