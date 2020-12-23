import { Operator, SecretKey, Server, Test, Certificate, Webspace, Session, Site } from "./operators";

import { PleskConnectionModel } from "@models/pleskConnection";

type OperatorName = "secret_key" | "certificate" | "server" | "webspace" | "session" | "site";

export interface IPleskCredentials {
	login: string;
	password: string;
}

/**
 * The JavaScript API for the external XML Plesk API.
 */
export class PleskApi {
	public apiKey?: string;

	public credentials?: IPleskCredentials;

	public readonly ipAddress: string;

	private readonly operatorCache: { [key in OperatorName]?: Operator<string> } = {};

	/**
	 * The JavaScript API for the external XML Plesk API.
	 *
	 * @param ipAddress - The IP of the external Plesk server.
	 */
	public constructor(ipAddress: string) {
		this.ipAddress = ipAddress;
	}

	/**
	 * Connect to the remote Plesk instance.
	 *
	 * @param credentials - The credentials to use to connect to the server, only required the first time this is called for this server.
	 */
	public async connect(credentials?: IPleskCredentials) {
		if(credentials === undefined) {
			const pleskConnection = await PleskConnectionModel.findOne({ ipAddress: this.ipAddress }).exec();

			if(pleskConnection === null) {
				throw new Error("No API key in database");
			}

			this.apiKey = pleskConnection.apiKey;
		} else {
			this.credentials = credentials;
		}
	}

	/**
	 * The secret key operator.
	 *
	 * @returns The secret key operator.
	 */
	//eslint-disable-next-line @typescript-eslint/naming-convention
	public get secret_key() {
		return this.getOperator("secret_key") as unknown as SecretKey;
	}

	/**
	 * The certificate operator.
	 *
	 * @returns The certificate operator.
	 */
	public get certificate() {
		return this.getOperator("certificate") as unknown as Certificate;
	}

	/**
	 * The server operator.
	 *
	 * @returns The server operator.
	 */
	public get server() {
		return this.getOperator("server") as unknown as Server;
	}

	/**
	 * The webspace operator.
	 *
	 * @returns The webspace operator.
	 */
	public get webspace() {
		return this.getOperator("webspace") as unknown as Webspace;
	}

	/**
	 * The session operator.
	 *
	 * @returns The session operator.
	 */
	public get session() {
		return this.getOperator("session") as unknown as Session;
	}

	/**
	 * The site operator.
	 *
	 * @returns The site operator.
	 */
	public get site() {
		return this.getOperator("site") as unknown as Site;
	}

	/**
	 * Test the connection to a remote plesk instance.
	 */
	public async testConnection() {
		const test = new Test(this);

		await test.testConnection();
	}

	/**
	 * Get the operator with the supplied name.
	 *
	 * @param operatorName - The name of the operator.
	 *
	 * @returns The operator.
	 */
	private getOperator(operatorName: OperatorName) {
		if(operatorName in this.operatorCache) {
			return this.operatorCache[operatorName];
		}

		let operator: Operator<string> | undefined;

		switch (operatorName) {
			case "secret_key":
				operator = new SecretKey(this);
				break;

			case "certificate":
				operator = new Certificate(this);
				break;

			case "server":
				operator = new Server(this);
				break;

			case "webspace":
				operator = new Webspace(this);
				break;

			case "session":
				operator = new Session(this);
				break;

			case "site":
				operator = new Site(this);
				break;
			default:
				break;
		}

		this.operatorCache[operatorName] = operator;

		return operator;
	}
}

/**
 * Get a Plesk API.
 *
 * @param ipAddress - The API of the remote plesk machine.
 * @param credentials - The credentials to use to log in for this API connection, this is only required for first log in
 * 	for this remote host, a secret key will then be generated and used for all subsequent requests.
 *
 * @returns A Plesk API connection.
 */
const getPleskApi = async (ipAddress: string, credentials?: IPleskCredentials) => {
	const api = new PleskApi(ipAddress);

	await api.connect(credentials);

	await api.testConnection();

	return api;
};

export default getPleskApi;