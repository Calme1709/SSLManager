import Joi from "joi";
import AuthenticationService from "@services/authentication";
import { MethodsDefinition, Handler } from "@utils/router";

interface IPostBody {
	username: string;
	password: string;
}

interface IPostResponse {
	token: string;
}

/**
 * Register a user and generate a new authentication token.
 *
 * @param data - The data passed with the HTTP request.
 *
 * @returns The generated authentication token.
 */
const register: Handler<IPostBody, undefined, IPostResponse> = async data => ({
	token: await AuthenticationService.register(data.body.username, data.body.password)
});

export default new MethodsDefinition({
	post: {
		restricted: false,
		handler: register,
		validation: Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required()
			})
		})
	}
});