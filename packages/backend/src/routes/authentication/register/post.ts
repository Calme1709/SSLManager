import AuthenticationService from "@services/authentication";
import { Handler } from "@utils/router";

interface IBody {
	username: string;
	password: string;
}

interface IResponse {
	token: string;
}

/**
 * Register a user and generate a new authentication token.
 *
 * @param data - The data passed with the HTTP request.
 * @param data.body - The HTTP body passed with the HTTP request.
 * @param data.body.username - The username that the user should use for further logins.
 * @param data.body.password - The password that the user should use for further logins.
 *
 * @returns The generated authentication token.
 */
const handler: Handler<IBody, undefined, IResponse> = async ({ body: { username, password } }) => ({
	token: await AuthenticationService.register(username, password)
});

export default handler;