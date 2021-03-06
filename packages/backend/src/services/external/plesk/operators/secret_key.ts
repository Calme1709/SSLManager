import Operator from "./base";
import { PleskApi } from "..";

interface IKeyInfo {
	ip_address: string;
	description: string;
	login: string;
}

/**
 * The operator for managing secret keys.
 */
export default class SecretKey extends Operator<"secret_key"> {
	/**
	 * Initialize the secret key API.
	 *
	 * @param pleskApi - The plesk API instance this operator is associated with.
	 */
	public constructor(pleskApi: PleskApi) {
		super("secret_key", pleskApi);
	}

	/**
	 * Create a new secret key used for accessing the API.
	 *
	 * @param ipAddress - This is optional. It specifies the IP address that will be linked to the key.
	 * If this node is not specified, the IP address of the request sender will be used.
	 *
	 * @param description - This is optional. It specifies additional information about the key.
	 *
	 * @param login - This is optional. It specifies the login name of an existing customer or a reseller that will have this secret key.
	 * The customer’s or reseller's account should be active. If this node is not specified, the administrator’s login will be used.
	 *
	 * @returns A promise which resolves to the new secret key that was generated by Plesk.
	 */
	public async create(ipAddress?: string, description?: string, login?: string) {
		const response = await this.xmlApiRequest<{ key: string }, "create">(
			"create",
			[
				this.createOptionalDataNode("ip_address", ipAddress),
				this.createOptionalDataNode("description", description),
				this.createOptionalDataNode("login", login)
			]
		);

		return response.key;
	}

	/**
	 * Retrieve information on secret keys located on the server.
	 *
	 * @param key - This is optional. To retrieve info on a specified key, pass it.
	 * To retrieve information about all keys leave this undefined.
	 *
	 * @returns Information about the specified key.
	 */
	//eslint-disable-next-line @typescript-eslint/naming-convention
	public async get_info<KeyType extends string | undefined>(key?: KeyType): Promise<KeyType extends undefined ? IKeyInfo[] : IKeyInfo> {
		return this.xmlApiRequest(
			"get_info",
			this.createDataNode(
				"filter",
				this.createOptionalDataNode("key", key)
			)
		);
	}

	/**
	 * Delete specified secret keys from the server.
	 *
	 * @param key - This is optional. To delete a specified key, set the key value for this node.
	 * To delete all secret keys, leave this undefined.
	 */
	public async delete(key?: string) {
		await this.xmlApiRequest(
			"delete",
			this.createDataNode(
				"filter",
				this.createOptionalDataNode("key", key)
			)
		);
	}
}