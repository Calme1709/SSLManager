import { Request, NextFunction } from "express";
import AuthenticationService from "@services/authentication";

/**
 * Ensure that the request contains a valid authentication code.
 *
 * @param req - The request to authenticate.
 * @param next - The express next function.
 */
export default async (req: Request, {}, next: NextFunction) => {
	const authenticationToken = req.headers.authenticationtoken;

	AuthenticationService.validateToken(authenticationToken as string | undefined)
		.then(() => next())
		.catch(err => next(err));
};