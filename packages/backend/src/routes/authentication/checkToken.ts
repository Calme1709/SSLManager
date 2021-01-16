import Joi from "joi";
import AuthenticationService from "@services/authentication";
import { Handler, MethodsDefinition } from "@utils/router";

const postSchema = Joi.object({
	authenticationToken: Joi.string().required()
});

interface ICheckTokenRequestBody {
	authenticationToken: string;
}

type PostHandler = Handler<ICheckTokenRequestBody, undefined, { isValid: boolean } | { isValid: boolean; reason: string }>;

/**
 * Check if the passed authentication token is valid.
 *
 * @param data - The data passed with the HTTP request.
 *
 * @returns Whether the token is valid, and the reason if it is not.
 */
const postHandler: PostHandler = async data => {
	const result = await AuthenticationService.validateToken(data.body.authenticationToken);

	return {
		isValid: result.isValid,
		reason: result.error?.reason
	};
};

export default new MethodsDefinition({
	post: {
		restricted: true,
		handler: postHandler,
		validation: postSchema
	}
});