import { Schema } from "joi";
import { Request, NextFunction } from "express";
import { ControlledError } from "@utils";

/**
 * Create a request validation middleware that ensures the incoming request has the correct data.
 *
 * @param schema - The Joi schema to validate against.
 *
 * @returns An express middleware function.
 */
export default (schema: Schema) => (req: Request, {}, next: NextFunction) => {
	const result = schema.validate(req);

	if(result.error !== undefined) {
		next(new ControlledError(422, result.error.details[0].message.replace(/"/g, "'")));
	}

	next();
};