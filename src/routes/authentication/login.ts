import { requestValidator } from "@middleware";
import Joi from "joi";
import { Handler } from "../handler";
import AuthenticationService from "@services/authentication";

const schema = Joi.object({
	username: Joi.string().required(),
	password: Joi.string().required()
});

interface ILoginRequestBody {
	username: string;
	password: string;
}

type LoginHandler = Handler<ILoginRequestBody, Record<string, string>, { authenticationToken: string }>;

/**
 * The express request handler for the login path.
 *
 * @param request - The express request object.
 * @param response - The express response object.
 * @param next - The express next function.
 */
const loginHandler: LoginHandler = async (request, response, next) => {
	const { username, password } = request.body;

	AuthenticationService.login(username, password)
		.then(authenticationToken => response.status(200).json({ authenticationToken }))
		.catch(err => next(err));
};

export default {
	post: [ requestValidator(schema, "body"), loginHandler ]
};