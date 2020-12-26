import { ControlledError } from "@utils";
import Operator from "./base";
import { PleskApi } from "..";

/**
 * The operator for testing connection to the remote Plesk Instance.
 * This class does not represent an operator on the Plesk side of this API, and is only to be used internally.
 */
export default class Test extends Operator<"server"> {
	/**
	 * Initialize the secret key API.
	 *
	 * @param pleskApi - The plesk API instance this operator is associated with.
	 */
	public constructor(pleskApi: PleskApi) {
		super("server", pleskApi);
	}

	/**
	 * Test if the connection to the remote Plesk instance is valid, and if the credentials are also.
	 *
	 * @returns A promise which resolves to void if the connection is valid, and rejects with an appropriate error if not.
	 */
	public async testConnection() {
		return new Promise<void>((resolve, reject) => {
			this.xmlApiRequest("get", this.createDataNode("stat", ""), true)
				.then(() => resolve())
				.catch((err: string) => {
					console.error(err);

					if(err === "You have entered incorrect username or password.") {
						reject(new ControlledError(403, "Incorrect Plesk login details"));
					} else {
						reject(new ControlledError(500, "Could not connect to remote Plesk API, is the URL correct?"));
					}
				});
		});
	}
}