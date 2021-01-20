import AuthenticationService from "@services/authentication";
import { Handler } from "@utils/router";

interface IBody {
	authenticationToken: string;
}

type Response = { isValid: boolean } | { isValid: boolean; reason: string };

/**
 * Check if the passed authentication token is valid.
 *
 * @param data - The data passed with the HTTP request.
 * @param data.body - The HTTP body passed with the HTTP request.
 * @param data.body.authenticationToken - The authentication token to check.
 *
 * @returns Whether the token is valid, and the reason if it is not.
 */
const handler: Handler<IBody, undefined, Response> = async ({ body: { authenticationToken } }) => {
	const result = await AuthenticationService.validateToken(authenticationToken);

	if(result.isValid) {
		return {
			isValid: true
		};
	}

	return {
		isValid: false,
		reason: result.error.reason
	};
};

export default handler;