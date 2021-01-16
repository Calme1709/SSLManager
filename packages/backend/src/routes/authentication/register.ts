import Joi from "joi";
import AuthenticationService from "@services/authentication";
import { MethodsDefinition, Handler } from "@utils/router";

interface IRegisterRequestBody {
	username: string;
	password: string;
}

type RegisterHandler = Handler<IRegisterRequestBody, Record<string, string>, { authenticationToken: string }>;

/**
 * Register a user and generate a new authentication token.
 *
 * @param data - The data passed with the HTTP request.
 *
 * @returns The generated authentication token.
 */
const register: RegisterHandler = async data => {
	const authenticationToken = await AuthenticationService.register(data.body.username, data.body.password);

	return { authenticationToken };
};

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