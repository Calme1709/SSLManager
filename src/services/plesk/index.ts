import getPleskAPI, { IPleskCredentials } from "../external/plesk";
import { PleskConnectionModel } from "@models/pleskConnection";
import { ControlledError } from "@utils";

/**
 * The Plesk service.
 */
export default class PleskService {
	/**
	 * Add an initialize a new Plesk instance.
	 *
	 * @param ip - The IP of the remote Plesk instance that is being added.
	 * @param credentials - The credentials that are used to log in to the new remote Plesk instance.
	 * @param useHttps - Whether to use HTTPS instead of HTTP when accessing the server.
	 */
	public static async addPleskInstance(ip: string, credentials: IPleskCredentials, useHttps: boolean) {
		if(await PleskConnectionModel.exists({ ipAddress: ip })) {
			throw new ControlledError(409, "Plesk instance already linked");
		}

		const connection = await getPleskAPI(ip, credentials);

		const apiKeyDescription = "API Key that is used by the SSLManager program for any interaction it has with this Plesk instance";

		const apiKey = await connection.secret_key.create(undefined, apiKeyDescription);

		await PleskConnectionModel.create({
			login: credentials.login,
			ipAddress: ip,
			apiKey,
			useHttps,
			sessionInfo: {
				expiration: 0,
				cookie: ""
			}
		});
	}
}