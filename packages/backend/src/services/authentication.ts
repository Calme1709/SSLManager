import { hash, compare } from "bcryptjs";

import { JsonWebTokens, ControlledError } from "@utils";
import { jwtSecret } from "@config";
import { UserModel } from "@models/user";

/**
 * The service that handles all business logic for authentication routes.
 */
export default class AuthenticationService {
	/**
	 * Check a user's password and if it is correct, create and return an authentication token for them.
	 *
	 * @param username - The username to login with.
	 * @param password - The password to login with.
	 *
	 * @returns The authentication token for this user to use.
	 */
	public static async login(username: string, password: string) {
		const user = await UserModel.findOne({ username }).exec();

		if(user === null) {
			throw new ControlledError(404, "User does not exist");
		}

		if(!(await compare(password, user.password))) {
			throw new ControlledError(401, "Incorrect password");
		}

		return JsonWebTokens.create({ username }, jwtSecret, "1d");
	}

	/**
	 * Register a new user.
	 *
	 * @param username - The username of the new user.
	 * @param password - The unhashed password of the new user.
	 *
	 * @returns The authentication token for the new user.
	 */
	public static async register(username: string, password: string) {
		if(await UserModel.exists({ username })) {
			throw new ControlledError(422, "User already exists");
		}

		const hashedPassword = await hash(password, 8);

		const user = await UserModel.create({ username, password: hashedPassword });

		await user.save();

		return JsonWebTokens.create({ username }, jwtSecret, "1d");
	}

	/**
	 * Check if a passed value is a valid authentication token.
	 *
	 * @param authenticationToken - The value to check.
	 *
	 * @returns Whether the token is valid, and the reason if it is not.
	 */
	public static async validateToken(authenticationToken: any) {
		if(typeof authenticationToken !== "string") {
			return {
				isValid: false,
				error: new ControlledError(403, "No authentication token provided")
			};
		}

		if(!JsonWebTokens.isValid(authenticationToken, jwtSecret)) {
			return {
				isValid: false,
				error: new ControlledError(403, "Invalid authentication token provided")
			};
		}

		if(!(await UserModel.exists({ username: JsonWebTokens.decode<{ username: string }>(authenticationToken).username }))) {
			return {
				isValid: false,
				error: new ControlledError(404, "User does not exist")
			};
		}

		return {
			isValid: true
		};
	}
}