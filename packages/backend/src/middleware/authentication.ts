import { Request, NextFunction } from "express";
import AuthenticationService from "@services/authentication";

/**
 * Ensure that the request contains a valid authentication code.
 *
 * @param req - The request to authenticate.
 * @param next - The express next function.
 */
export default (req: Request, {}, next: NextFunction) => {
	const authenticationToken = req.headers.authenticationtoken;

	AuthenticationService.validateToken(authenticationToken as string | undefined)
		.then(validationResult => {
			if(validationResult.isValid) {
				next();

				return;
			}

			next(validationResult.error);
		})
		.catch(err => next(err));
};