import { request } from "http";
import { request as requestHttps, RequestOptions } from "https";
import { URL } from "url";

/**
 * Make a request with the specified request options.
 *
 * @param protocol - Which protocol to use (http or https).
 * @param requestOptions - The request information about the request.
 *
 * @returns The response from the server.
 */
export default (protocol: "http" | "https", requestOptions: RequestOptions | URL | string): Promise<string> => {
	const requestMethod = {
		http: request, https: requestHttps
	}[protocol];

	return new Promise((resolve, reject) => {
		let data = "";

		const req = requestMethod(requestOptions, response => {
			response.on("data", chunk => {
				data += chunk;
			});

			response.on("error", err => {
				reject(err);
			});

			response.on("end", () => {
				resolve(data);
			});
		});

		req.on("error", err => {
			reject(err);
		});

		req.end();
	});
};