import { Schema } from "joi";
import { Request, NextFunction } from "express";
import { ControlledError } from "@utils";

/**
 * Create a parameter validator that ensures the incoming request has the correct parameters.
 *
 * @param schema - The Joi schema to validate against.
 * @param dataToValidate - The request data to validate (either the body (for post/put/patch requests) or the query).
 *
 * @returns An express middleware function.
 */
export default (schema: Schema, dataToValidate: "body" | "query" = "query") => (req: Request, {}, next: NextFunction) => {
	const result = schema.validate(req[dataToValidate]);

	if(result.error !== undefined) {
		next(new ControlledError(422, result.error.details[0].message.replace(/"/g, "'")));
	}

	next();
};