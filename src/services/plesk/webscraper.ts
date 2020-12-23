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
	 * Get the certificate details (csr, pvt, crt, ca and name) of the currently active SSL certificate for a domain.
	 *
	 * @param domainId - The ID of the domain to retrieve the SSL certificate information of.
	 *
	 * @returns The information about the domains SSL certificate.
	 */
	public async getActiveCertDetails(domainId: number) {
		const connection = await getPleskApi("192.168.1.179");

		const siteInfo = (await connection.site.get({ type: "id", value: domainId }));

		if(siteInfo.data.hosting.vrt_hst.property.certificate_name === undefined) {
			return undefined;
		}

		const listHtml = await this.getHtml(`/smb/ssl-certificate/list/id/${domainId}`);

		const certUrl = listHtml.querySelectorAll("#ssl-certificate-list-table tbody tr td a")
			.find(({ classNames, innerText }) => classNames.length === 0 && innerText === siteInfo.data.hosting.vrt_hst.property.certificate_name)!
			.getAttribute("href")!;

		const certHtml = await this.getHtml(certUrl);

		const crt = certHtml.querySelector("#infoCertificate-content-area").innerText;
		const ca = certHtml.querySelector("#infoCaCertificate-content-area").innerText;

		return {
			name: siteInfo.data.hosting.vrt_hst.property.certificate_name,
			csr: certHtml.querySelector("#infoCsr-content-area").innerText,
			pvt: certHtml.querySelector("#infoPrivateKey-content-area").innerText,
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

				const session = (await connection.session.get()).find(sess => sess !== undefined && sess.id === sessionInfo.cookie);
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

				await pleskInfo.updateOne({ sessionInfo: this.sessionInfo });
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

		return parseHtml(html);
	}
}