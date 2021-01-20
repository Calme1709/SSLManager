import { MethodsDefinition } from "@utils/router";
import postHandler from "./post";
import Joi from "joi";

export default new MethodsDefinition({
	post: {
		restricted: false,
		handler: postHandler,
		validation: Joi.object({
			body: Joi.object({
				authenticationToken: Joi.string().required()
			})
		})
	}
});