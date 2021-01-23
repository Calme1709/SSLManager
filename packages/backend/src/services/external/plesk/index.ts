//TODO: Extract this library into a separate NPM package.
import { Operator, SecretKey, Server, Test, Certificate, Webspace, Session, Site } from "./operators";

import { PleskConnectionModel } from "@models/pleskConnection";

type OperatorName = "certificate" | "secret_key" | "server" | "session" | "site" | "webspace";

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

	public readonly hostname: string;

	private readonly operatorCache: { [key in OperatorName]?: Operator<string> } = {};

	/**
	 * The JavaScript API for the external XML Plesk API.
	 *
	 * @param hostname - The hostname of the external Plesk server.
	 */
	public constructor(hostname: string) {
		this.hostname = hostname;
	}

	/**
	 * Connect to the remote Plesk instance.
	 *
	 * @param credentials - The credentials to use to connect to the server, only required the first time this is called for this server.
	 */
	public async connect(credentials?: IPleskCredentials) {
		if(credentials === undefined) {
			const pleskConnection = await PleskConnectionModel.findOne({ hostname: this.hostname }).exec();

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

		const operators = {
			secret_key: SecretKey,
			certificate: Certificate,
			server: Server,
			webspace: Webspace,
			session: Session,
			site: Site
		};

		const operator = new operators[operatorName](this);

		this.operatorCache[operatorName] = operator;

		return operator;
	}
}

/**
 * Generate a connection to a remote Plesk instance.
 *
 * @param hostname - The hostname of the remote plesk machine.
 * @param credentials - The credentials to use to log in for this API connection, this is only required for first log in
 * 	for this remote host, a secret key will then be generated and used for all subsequent requests.
 *
 * @returns A Plesk API connection.
 */
const createPleskApiConnection = async (hostname: string, credentials?: IPleskCredentials) => {
	const api = new PleskApi(hostname);

	await api.connect(credentials);

	await api.testConnection();

	return api;
};

const apiCache: Record<string, Promise<PleskApi> | undefined> = {};

/**
 * Get a Plesk API.
 *
 * @param hostname - The hostname of the remote plesk machine.
 * @param credentials - The credentials to use to log in for this API connection, this is only required for first log in
 * 	for this remote host, a secret key will then be generated and used for all subsequent requests.
 *
 * @returns A Plesk API connection.
 */
const getPleskApi = (hostname: string, credentials?: IPleskCredentials) => {
	//TODO: Check log in before saving to cache.
	if(apiCache[hostname] === undefined) {
		apiCache[hostname] = createPleskApiConnection(hostname, credentials);
	}

	return apiCache[hostname]!;
};

export default getPleskApi;