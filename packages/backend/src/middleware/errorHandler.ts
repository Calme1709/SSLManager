import { Response } from "express";
import { ControlledError, Logger } from "@utils";

/**
 * Handle an error that has been passed through the express middleware.
 *
 * @param err - The error.
 * @param res - The response object used for communicating with the client.
 */
export default (err: ControlledError | Error, {}, res: Response, {}) => {
	const isControlledError = err instanceof ControlledError;

	if(!isControlledError) {
		Logger.error((err as Error).message);
	}

	const error = isControlledError ? err as ControlledError : new ControlledError(500, "Internal server error");

	res.status(error.httpCode).json({
		success: false,
		error: error.reason
	});
};