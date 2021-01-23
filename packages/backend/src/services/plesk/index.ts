import { IPleskCredentials } from "../external/plesk";
import { PleskConnectionModel } from "@models/pleskConnection";
import { ControlledError } from "@utils";
import PleskInstanceImporter from "./instanceImporter";

/**
 * The Plesk service.
 */
export default class PleskService {
	/**
	 * Add and initialize a new Plesk instance.
	 *
	 * @param friendlyName - The friendly name of this server, will be used in most situations that is user facing instead of the hostname.
	 * @param hostname - The hostname of the remote Plesk instance that is being added.
	 * @param credentials - The credentials that are used to log in to the new remote Plesk instance.
	 * @param useHttps - Whether to use HTTPS instead of HTTP when accessing the server.
	 */
	public static async addPleskInstance(friendlyName: string, hostname: string, credentials: IPleskCredentials, useHttps: boolean) {
		if(await PleskConnectionModel.exists({ hostname })) {
			throw new ControlledError(409, "Plesk instance already linked");
		}

		await PleskInstanceImporter.import(friendlyName, hostname, credentials, useHttps);
	}
}