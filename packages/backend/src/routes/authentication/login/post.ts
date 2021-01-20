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
 * Log a user in and generate an authentication token to be used for future requests by this user.
 *
 * @param data - The data passed with the HTTP request.
 * @param data.body - The HTTP body passed with the request.
 * @param data.body.username - The username that the user is trying to log in with.
 * @param data.body.password - The password the user is trying to log in with.
 * @returns The authentication token.
 */
const handler: Handler<IBody, undefined, IResponse> = async ({ body: { username, password } }) => ({
	token: await AuthenticationService.login(username, password)
});

export default handler;