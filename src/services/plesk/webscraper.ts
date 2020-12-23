import { PleskConnectionModel } from "@models/pleskConnection";
import parseHtml from "node-html-parser";
import { Browser, launch } from "puppeteer";
import getPleskApi from "@services/external/plesk/index";
import { getIpAddress } from "@utils";

/**
 * Provides Plesk web-scraping functionality for this application, this is useful to harness features of
 * Plesk not exposed through the XML RPC API.
 */
export default class PleskWebScraper {
	private readonly ipAddress: string;

	private sessionInfo: { cookie: string; expiration: number } = { cookie: "", expiration: 0 };

	private useHttps?: boolean;

	private browser?: Browser;

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
		if(this.sessionInfo.expiration < Date.now()) {
			const pleskInfo = (await PleskConnectionModel.findOne({ ipAddress: this.ipAddress }).exec())!;

			const { sessionInfo } = pleskInfo;

			if(sessionInfo.expiration > Date.now() + (new Date().getTimezoneOffset())) {
				this.sessionInfo = sessionInfo;
			} else {
				const connection = await getPleskApi(this.ipAddress);

				const session = (await connection.session.get()).find(({ id }) => id === sessionInfo.cookie);
				const idleTime = (await connection.server.get()).session_setup.login_timeout * 60 * 1000;

				if(session === undefined) {
					//Generate a new session.
					const sessionId = await connection.server.create_session(pleskInfo.login, {
						user_ip: await getIpAddress(this.ipAddress),
						back_url: ""
					});

					const browser = await launch({ headless: false });
					const page = await browser.newPage();

					await page.goto(`${pleskInfo.useHttps ? "https" : "http"}://${this.ipAddress}:${pleskInfo.useHttps ? 8443 : 8880}/enterprise/rsession_init.php?PLESKSESSID=${sessionId}`);

					browser.close().catch(console.error);

					this.sessionInfo = {
						cookie: sessionId,
						expiration: Date.now() + idleTime
					};
				} else {
					this.sessionInfo = { cookie: sessionInfo.cookie, expiration: Date.parse(session.idle) + idleTime };
				}

				await pleskInfo.update({ sessionInfo: this.sessionInfo });
			}
		}

		return this.sessionInfo.cookie;
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
	 * Get a new browser page.
	 *
	 * @returns The new puppeteer browser page.
	 */
	private async getNewPage() {
		if(this.browser === undefined) {
			this.browser = await launch({ headless: false });
		}

		return this.browser.newPage();
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

		const page = await this.getNewPage();

		await page.setExtraHTTPHeaders({ Cookie: `PLESKSESSID${useHttps ? "" : "_INSECURE"}=${cookie}` });

		await page.goto(`${useHttps ? "https" : "http"}://${this.ipAddress}:${useHttps ? 8443 : 8880}/${path}`);

		const html = await page.$eval("html", element => element.innerHTML);

		await page.close();

		return parseHtml(html);
	}
}