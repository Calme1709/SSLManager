import { request } from "https";
import { Logger, ControlledError } from "@utils";
import { TheSSLStoreURL } from "@config";
import { ITheSSLStoreCredentials } from "..";

type ApiResponse<ResponseType> = ResponseType & {
	AuthResponse: {
		isError: boolean;
		Message: string;
		Timestamp: string;
		ReplayToken: string;
		InvokingPartnerCode: string;
	};
};

/**
 * The class that all API operators derive from.
 */
export default class Operator {
	private readonly operatorName: string;

	private readonly credentials: ITheSSLStoreCredentials;

	/**
	 * Create an operator.
	 *
	 * @param operatorName - The name of the operator.
	 * @param credentials - The credentials that are used to access the TheSSLStore API.
	 */
	public constructor(operatorName: string, credentials: ITheSSLStoreCredentials) {
		this.operatorName = operatorName;
		this.credentials = credentials;
	}

	/**
	 * Make an API request of the specified operation with the passed data.
	 *
	 * @param operation - The operation to execute.
	 * @param data - The data to send with the API request.
	 *
	 * @returns A promise that resolves to the API Response.
	 */
	protected apiRequest<ResponseType>(operation: string, data: any) {
		return new Promise<ResponseType>((resolve, reject) => {
			const requestBody = JSON.stringify({
				AuthRequest: {
					AuthToken: this.credentials.authToken,
					PartnerCode: this.credentials.partnerCode
				},
				...data
			});

			let responseData = "";

			const req = request({
				method: "POST",
				hostname: TheSSLStoreURL,
				port: 80,
				path: `/rest/${this.operatorName}/${operation}`,
				headers: { "Content-Type": "application/json" }
			}, response => {
				response.on("data", chunk => {
					responseData += chunk;
				});

				response.on("end", () => {
					const result = JSON.parse(responseData) as ApiResponse<ResponseType>;

					if(result.AuthResponse.isError) {
						Logger.error(`TheSSLStore API error: ${result.AuthResponse.Message}`);

						reject(new ControlledError(502, "Error interacting with TheSSLStore API, please check the log for more information"));
					} else {
						resolve(result);
					}
				});
			});

			req.on("error", err => {
				Logger.error(err.message);

				reject(new ControlledError(502, "Communication with TheSSLStore API failed, check the log for more information"));
			});

			req.write(requestBody);
			req.end();
		});
	}
}