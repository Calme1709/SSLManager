import Joi from "joi";
import { MethodsDefinition } from "@utils/router";
import postHandler from "./post";

export default new MethodsDefinition({
	post: {
		handler: postHandler,
		restricted: false,
		validation: Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required()
			})
		})
	}
});