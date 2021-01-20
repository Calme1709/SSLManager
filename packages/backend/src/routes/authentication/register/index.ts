import { MethodsDefinition } from "@utils/router";
import Joi from "joi";
import postHandler from "./post";

export default new MethodsDefinition({
	post: {
		restricted: false,
		handler: postHandler,
		validation: Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required()
			})
		})
	}
});