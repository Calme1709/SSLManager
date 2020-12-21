import { PleskConnectionModel } from "@models/pleskConnection";
import parseHtml from "node-html-parser";
import { launch } from "puppeteer";
import PleskSessionHandler from "./pleskSessionHandler";

/**
 * Provides Plesk web-scraping functionality for this application, this is useful to harness features of
 * Plesk not exposed through the XML RPC API.
 */
export default class PleskWebScraper {
	private readonly ipAddress: string;

	private cookie?: string;

	private useHttps?: boolean;

	/**
	 * Plesk web-scraper, this is useful for .
	 *
	 * @param ipAddress - The IP address of the remote Plesk instance.
	 */
	public constructor(ipAddress: string) {
		this.ipAddress = ipAddress;
	}

	/**
	 * Get details about an SSL certificate.
	 *
	 * @param domainId - The ID of the domain which the ssl certificate is associated with.
	 * @param certificateId - The ID of the certificate.
	 *
	 * @returns The details about the certificate.
	 */
	public async getCertificateDetails(domainId: number, certificateId: number) {
		const html = await this.getHtml(`smb/ssl-certificate/edit/id/${domainId}/certificateId/${certificateId}`);

		const crt = html.querySelector("#infoCertificate-content-area").innerText.replace(/\n/g, "");
		const ca = html.querySelector("#infoCaCertificate-content-area").innerText.replace(/\n/g, "");

		return {
			csr: html.querySelector("#infoCsr-content-area").innerText.replace(/\n/g, ""),
			pvt: html.querySelector("#infoPrivateKey-content-area").innerText.replace(/\n/g, ""),
			crt: crt === "The component is missing." ? undefined : crt,
			ca: ca === "The component is missing." ? undefined : ca
		};
	}

	/**
	 * Get a plesk session cookie, this is required for logging into plesk.
	 *
	 * @returns The cookie.
	 */
	private async getCookie() {
		if(this.cookie === undefined) {
			const pleskInfo = (await PleskConnectionModel.findOne({ ipAddress: this.ipAddress }).exec())!;

			if(pleskInfo.cookie === undefined || Date.now() > pleskInfo.cookieExpiry! - (10 * 1000)) {
				const { cookie, cookieExpiry } = await PleskSessionHandler.getNewCookie(this.ipAddress);

				//TODO: Remove old session cookie from plesk if it still exists
				await pleskInfo.updateOne({ cookie, cookieExpiry });

				this.cookie = cookie;
			} else {
				this.cookie = pleskInfo.cookie;
			}
		}

		return this.cookie;
	}

	/**
	 * Whether we should use HTTPS instead of HTTP when scraping this Plesk instance.
	 *
	 * @returns Whether to use HTTPS.
	 */
	private async shouldUseHttps() {
		if(this.useHttps === undefined) {
			const pleskInfo = await PleskConnectionModel.findOne({ ipAddress: this.ipAddress }).exec();

			this.useHttps = pleskInfo!.useHttps;
		}

		return this.useHttps;
	}

	/**
	 * Get the HTML dom from a specified path.
	 *
	 * @param path - The path to retrieve the HTML for.
	 *
	 * @returns A promise that resolves to the parsed HTML.
	 */
	private async getHtml(path: string) {
		const useHttps = await this.shouldUseHttps();
		const cookie = await this.getCookie();

		const browser = await launch({ headless: false });
		const page = await browser.newPage();

		await page.setExtraHTTPHeaders({ Cookie: `PLESKSESSID${useHttps ? "" : "_INSECURE"}=${cookie}` });

		await page.goto(`${useHttps ? "https" : "http"}://${this.ipAddress}:${useHttps ? 8443 : 8880}/${path}`);

		const html = await page.$eval("html", element => element.innerHTML);

		browser.close().catch(console.error);

		return parseHtml(html);
	}
}