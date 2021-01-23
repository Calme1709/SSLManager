import https from "https";
import { Buffer } from "buffer";
import { Logger, ControlledError, parseXmlToJson } from "@utils";
import { PleskApi } from "..";

interface IApiErrorResponse {
	packet: {
		system: {
			errtext: string;
			errcode: number;
			status: "error";
		};
	};
}

interface IApiSuccessResponse<Operator extends string, Operation extends string, ResponseType> {
	packet: {
		[a in Operator]: {
			[b in Operation]: {
				result: ResponseType;
			};
		};
	};
}

type ApiResponse<Operator extends string, Operation extends string, ResponseType> =
	IApiErrorResponse |
	IApiSuccessResponse<Operator, Operation, ResponseType>;

/**
 * The class that all API operators derive from.
 */
export default class Operator<OperatorName extends string> {
	private readonly operatorName: OperatorName;

	private readonly pleskApi: PleskApi;

	/**
	 * Create an operator.
	 *
	 * @param operatorName - The name of the operator.
	 * @param pleskApi - The API instance this operator is associated with.
	 */
	public constructor(operatorName: OperatorName, pleskApi: PleskApi) {
		this.pleskApi = pleskApi;

		this.operatorName = operatorName;
	}

	/**
	 * Make an XML API request of the specified operation with the passed data.
	 *
	 * @param operation - The operation to execute.
	 * @param dataNodes - The data to send with the XML API request.
	 * @param verboseErrors - Whether to throw verbose errors (true) or simplified errors (false).
	 *
	 * @returns A promise that resolves to the API Response.
	 */
	protected xmlApiRequest<ResponseType, OperationName extends string>(
		operation: OperationName,
		dataNodes: string[] | string | undefined,
		verboseErrors = false
	) {
		return new Promise<ResponseType>((resolve, reject) => {
			const requestBody = `<?xml version="1.0" encoding="utf-8"?>${this.generatePacket(operation, dataNodes)}`;

			const authHeaders = this.pleskApi.apiKey === undefined
				? { HTTP_AUTH_LOGIN: (this.pleskApi.credentials!).login, HTTP_AUTH_PASSWD: (this.pleskApi.credentials!).password }
				: { KEY: this.pleskApi.apiKey };

			const req = https.request({
				method: "POST",
				host: this.pleskApi.hostname,
				port: 8443,
				path: "/enterprise/control/agent.php",
				headers: { "Content-Type": "text/xml", "Content-Length": Buffer.byteLength(requestBody), ...authHeaders }
			}, response => {
				let data = "";

				response.on("data", chunk => {
					data += chunk;
				});

				response.on("end", () => {
					const result = parseXmlToJson<ApiResponse<OperatorName, OperationName, ResponseType>>(data);

					//TODO: Custom parsing of Arrays (admin-domain-list, property, etc)
					if("system" in result.packet) {
						const userErr = new ControlledError(502, "Error interacting with the Plesk API, please check log for more information");

						reject(this.handleError(result.packet.system.errtext, userErr, verboseErrors));
					} else {
						resolve(result.packet[this.operatorName][operation].result);
					}
				});
			});

			req.on("error", err => {
				const userErr = new ControlledError(502, "Communication with Plesk API failed, check log for more information");

				reject(this.handleError(err.message, userErr, verboseErrors));
			});

			req.write(requestBody);
			req.end();
		});
	}

	/**
	 * Generate a node if the data is defined, else return an empty string.
	 *
	 * @param node - The name of the node.
	 * @param nodeData - The data of the node.
	 *
	 * @returns The generated node or empty string.
	 */
	protected createOptionalDataNode(node: string, nodeData?: Array<string | undefined> | string) {
		if(nodeData !== undefined && nodeData !== "") {
			return this.createDataNode(node, nodeData as string);
		}

		if(Array.isArray(nodeData) && nodeData.some(data => !(data === undefined || data === ""))) {
			return this.createDataNode(node, nodeData as string[]);
		}

		return "";
	}

	/**
	 * Generate a data node.
	 *
	 * @param node - The name of the node.
	 * @param nodeData - The data of the node.
	 *
	 * @returns The generated node.
	 */
	protected createDataNode(node: string, nodeData: string[] | string) {
		if(typeof nodeData === "string") {
			return `
				<${node}>${nodeData}</${node}>
			`;
		}

		return `
			<${node}>${nodeData.join("")}</${node}>
		`;
	}

	/**
	 * Generate an XML packet for an API request given the structure and data of the request.
	 *
	 * @param operation - The operation to perform, for example create.
	 * @param dataNodes - The data to send with the request.
	 *
	 * @returns The XML packet to send to the server.
	 */
	private generatePacket(operation: string, dataNodes?: string[] | string) {
		let dataNodeString: string;

		switch (typeof dataNodes) {
			case "undefined":
				dataNodeString = "";
				break;
			case "string":
				dataNodeString = dataNodes;
				break;
			default:
				dataNodeString = dataNodes.join("");
		}

		return `
			<packet>
				<${this.operatorName}>
					<${operation}>
						${dataNodeString}
					</${operation}>
				</${this.operatorName}>
			</packet>
		`.replace(/[\t]/g, "");
	}

	/**
	 * Generate an error message depending on the level of verbosity, and log this error if it is not to be logged to the user.
	 *
	 * @param actualError - The actual error message.
	 * @param userError - The controlled error which will be passed to the user in case of low verbosity.
	 * @param verbose - Whether to send the actual or simplified error message to the user.
	 *
	 * @returns The error to throw.
	 */
	private handleError(actualError: string, userError: ControlledError, verbose: boolean) {
		if(!verbose) {
			Logger.log(actualError);
		}

		return verbose ? actualError : userError;
	}
}