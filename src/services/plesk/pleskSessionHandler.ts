import getPleskApi from "@services/external/plesk/index";
import { PleskConnectionModel } from "@models/pleskConnection";
import { getIpAddress } from "@utils";
import { launch } from "puppeteer";

/**
 * Used for managing sessions with the remote Plesk instance's GUI, used for web scraping.
 */
export default class PleskSessionHandler {
	/**
	 * Get a new cookie and activate the session on the remote Plesk instance.
	 *
	 * @param ipAddress - The IP address of the remote instance.
	 *
	 * @returns The new cookie and when this cookie will expire.
	 */
	public static async getNewCookie(ipAddress: string) {
		const pleskInfo = (await PleskConnectionModel.findOne({ ipAddress }))!;

		const connection = await getPleskApi(ipAddress);

		const sessionId = await connection.server.create_session(pleskInfo.login, { user_ip: await getIpAddress(ipAddress), back_url: "" });
		const sessionLength = (await connection.server.get()).session_setup.login_timeout * 60 * 1000;

		const browser = await launch({ headless: false });
		const page = await browser.newPage();

		await page.goto(`${pleskInfo.useHttps ? "https" : "http"}://${ipAddress}:${pleskInfo.useHttps ? 8443 : 8880}/enterprise/rsession_init.php?PLESKSESSID=${sessionId}`);

		browser.close().catch(console.error);

		return {
			cookie: sessionId,
			cookieExpiry: Date.now() * sessionLength
		};
	}
}