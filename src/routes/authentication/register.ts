import { requestValidator } from "@middleware";
import Joi from "joi";
import { Handler } from "../handler";
import AuthenticationService from "@services/authentication";

const schema = Joi.object({
	username: Joi.string().required(),
	password: Joi.string().required()
});

interface IRegisterRequestBody {
	username: string;
	password: string;
}

type RegisterHandler = Handler<IRegisterRequestBody, Record<string, string>, { authenticationToken: string }>;

/**
 * The express request handler for the register path.
 *
 * @param request - The express request object.
 * @param response - The express response object.
 * @param next - The express next function.
 */
const registerHandler: RegisterHandler = async (request, response, next) => {
	const { username, password } = request.body;

	AuthenticationService.register(username, password)
		.then(authenticationToken => response.status(200).json({ authenticationToken }))
		.catch(err => next(err));
};

export default {
	post: [ requestValidator(schema, "body"), registerHandler ]
};