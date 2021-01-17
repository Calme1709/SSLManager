import Joi from "joi";
import AuthenticationService from "@services/authentication";
import { Handler, MethodsDefinition } from "@utils/router";

interface IPostBody {
	authenticationToken: string;
}

type PostResponse = { isValid: boolean } | { isValid: boolean; reason: string };

/**
 * Check if the passed authentication token is valid.
 *
 * @param data - The data passed with the HTTP request.
 *
 * @returns Whether the token is valid, and the reason if it is not.
 */
const postHandler: Handler<IPostBody, undefined, PostResponse> = async data => {
	const result = await AuthenticationService.validateToken(data.body.authenticationToken);

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

export default new MethodsDefinition({
	post: {
		restricted: true,
		handler: postHandler,
		validation: Joi.object({
			body: Joi.object({
				authenticationToken: Joi.string().required()
			})
		})
	}
});