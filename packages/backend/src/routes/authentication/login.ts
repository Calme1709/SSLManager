import Joi from "joi";
import AuthenticationService from "@services/authentication";
import { Handler, MethodsDefinition } from "@utils/router";

interface ILoginRequestBody {
	username: string;
	password: string;
}

type LoginHandler = Handler<ILoginRequestBody, Record<string, string>, { authenticationToken: string }>;

/**
 * Log a user in and generate an authentication token to be used for future requests by this user.
 *
 * @param data - The data passed with the HTTP request.
 *
 * @returns The authentication token.
 */
const postHandler: LoginHandler = async data => {
	const authenticationToken = await AuthenticationService.login(data.body.username, data.body.password);

	return { authenticationToken };
};

export default new MethodsDefinition({
	post: {
		handler: postHandler,
		restricted: false,
		validation: Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required()
			})
		})
	}
});