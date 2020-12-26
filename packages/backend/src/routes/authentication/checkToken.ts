import { requestValidator } from "@middleware";
import Joi from "joi";
import { Handler } from "../handler";
import AuthenticationService from "@services/authentication";
import { ControlledError } from "@utils";

const schema = Joi.object({
	authenticationToken: Joi.string().required()
});

interface ICheckTokenRequestBody {
	authenticationToken: string;
}

type CheckTokenHandler = Handler<ICheckTokenRequestBody, Record<string, string>, { isValid: boolean }>;

/**
 * The express request handler for the login path.
 *
 * @param request - The express request object.
 * @param response - The express response object.
 * @param next - The express next function.
 */
const checkTokenHandler: CheckTokenHandler = async (request, response, next) => {
	const { authenticationToken } = request.body;

	AuthenticationService.validateToken(authenticationToken)
		.then(() => response.status(200).json({ isValid: true }))
		.catch(err => {
			if(!(err instanceof ControlledError)) {
				next(err);

				return;
			}

			response.status(200).json({ isValid: false });
		});
};

export default {
	post: [ requestValidator(schema, "body"), checkTokenHandler ]
};