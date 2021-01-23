import { PleskConnectionModel } from "@models/pleskConnection";
import parseHtml from "node-html-parser";
import getPleskApi from "@services/external/plesk/index";
import { getIpAddress, getPuppeteerBrowser } from "@utils";

/**
 * Provides Plesk web-scraping functionality for this application, this is useful to harness features of
 * Plesk not exposed through the XML RPC API.
 */
export default class PleskWebScraper {
	private readonly hostname: string;

	private sessionInfo: { cookie: string; expiration: number } = { cookie: "", expiration: 0 };

	private useHttps?: boolean;

	/**
	 * Plesk web-scraper, this is useful for .
	 *
	 * @param hostname - The hostname of the remote Plesk instance.
	 */
	public constructor(hostname: string) {
		this.hostname = hostname;
	}

	/**
	 * Get the certificate details (csr, pvt, crt, ca and name) of the currently active SSL certificate for a domain.
	 *
	 * @param domainId - The ID of the domain to retrieve the SSL certificate information of.
	 *
	 * @returns The information about the domains SSL certificate.
	 */
	public async getDomainActiveCertDetails(domainId: number) {
		const connection = await getPleskApi(this.hostname);

		const siteInfo = (await connection.site.get({ type: "id", value: domainId }));

		if(siteInfo.data.hosting.vrt_hst.property.certificate_name === undefined) {
			return undefined;
		}

		//TODO: Clean this up, possibly cache master list?
		let certUrl = "";

		const certLink = (await this.getHtml(`/smb/ssl-certificate/list/id/${domainId}`))
			.querySelectorAll("#ssl-certificate-list-table tbody tr td a")
			.find(({ classNames, innerText }) => classNames.length === 0 && innerText === siteInfo.data.hosting.vrt_hst.property.certificate_name);

		if(certLink === undefined) {
			//Certificate is in master repo
			certUrl = (await this.getHtml("/admin/ssl-certificate/list"))
				.querySelectorAll("#ssl-certificate-list-table tbody tr td a")
				.find(({ classNames, innerText }) => classNames.length === 0 && innerText === siteInfo.data.hosting.vrt_hst.property.certificate_name)!
				.getAttribute("href")!;
		} else {
			certUrl = certLink.getAttribute("href")!;
		}

		const certHtml = await this.getHtml(certUrl);

		//TODO: Debug "Cannot read property innerText of null" when adding SSL of domain id: 57 on trophy
		const cert = certHtml.querySelector("#infoCertificate-content-area").innerText;
		const ca = certHtml.querySelector("#infoCaCertificate-content-area").innerText;
		const csr = certHtml.querySelector("#infoCsr-content-area").innerText;

		return {
			name: siteInfo.data.hosting.vrt_hst.property.certificate_name,
			csr: csr.replace(/\n/g, "") === "The component is missing." ? undefined : csr,
			pvt: certHtml.querySelector("#infoPrivateKey-content-area").innerText,
			cert: cert.replace(/\n/g, "") === "The component is missing." ? undefined : cert,
			ca: ca.replace(/\n/g, "") === "The component is missing." ? undefined : ca
		};
	}

	/**
	 * Get a plesk session cookie, this is required for logging into plesk.
	 *
	 * @returns The cookie.
	 */
	private async getCookie() {
		if(this.sessionInfo.expiration < Date.now()) {
			const pleskInfo = (await PleskConnectionModel.findOne({ hostname: this.hostname }).exec())!;

			const { sessionInfo } = pleskInfo;

			if(sessionInfo.expiration > Date.now() + (new Date().getTimezoneOffset())) {
				this.sessionInfo = sessionInfo;
			} else {
				const connection = await getPleskApi(this.hostname);

				const idleTime = (await connection.server.get()).session_setup.login_timeout * 60 * 1000;
				const session = (await connection.session.get()).find(sess => sess.id === sessionInfo.cookie);

				if(session === undefined) {
					//Generate a new session.
					const sessionId = await connection.server.create_session(pleskInfo.login, {
						user_ip: await getIpAddress(this.hostname),
						back_url: ""
					});

					//TODO: See why the program stops after this log when adding new instances sometimes.
					const page = await (await getPuppeteerBrowser()).newPage();

					await page.goto(`${pleskInfo.useHttps ? "https" : "http"}://${this.hostname}:${pleskInfo.useHttps ? 8443 : 8880}/enterprise/rsession_init.php?PLESKSESSID=${sessionId}`);

					await page.close();

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
			const pleskInfo = await PleskConnectionModel.findOne({ hostname: this.hostname }).exec();

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
		const page = await (await getPuppeteerBrowser()).newPage();

		await page.setExtraHTTPHeaders({ Cookie: `PLESKSESSID${useHttps ? "" : "_INSECURE"}=${cookie}` });

		await page.goto(`${useHttps ? "https" : "http"}://${this.hostname}:${useHttps ? 8443 : 8880}/${path}`.replaceAll("//", "/"));

		const html = await page.$eval("html", element => element.innerHTML);

		await page.close();

		return parseHtml(html);
	}
}