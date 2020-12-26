import { requestValidator, authentication } from "@middleware";
import Joi from "joi";
import { Handler } from "./handler";
import { OptionModel, Option } from "@models/options";
import { Router as expressRouter } from "express";

const postSchema = Joi.object({
	options: Joi.array().items(Joi.object({
		key: Joi.string().required(),
		value: Joi.string().required()
	}))
});

interface IPostRequestBody {
	options: Array<{
		key: string;
		value: string;
	}>;
}

type PostHandler = Handler<IPostRequestBody, Record<string, string>, { authenticationToken: string }>;

/**
 * The express request handler for the post method.
 *
 * @param request - The express request object.
 * @param response - The express response object.
 * @param next - The express next function.
 */
const postHandler: PostHandler = async (request, response, next) => {
	const { options } = request.body;

	const promises: Array<Promise<void>> = [];

	for(const option of options) {
		promises.push(OptionModel.set(option.key, option.value));
	}

	Promise.all(promises)
		.then(() => response.status(200).send())
		.catch(next);
};

type GetHandler = Handler<Record<string, string>, Record<string, string>, Option[]>;

/**
 * The express request handler for the post method.
 *
 * @param request - The express request object.
 * @param response - The express response object.
 * @param next - The express next function.
 */
const getHandler: GetHandler = async ({}, response, {}) => {
	const valuesDoc = await OptionModel.find({});

	const values = valuesDoc.map(value => {
		const val = value.toObject() as Option;

		return {
			key: val.key,
			value: val.value
		};
	});

	response.status(200).json(values);
};

const router = expressRouter();

router.get("/", ...[ authentication, getHandler ]);
router.post("/", ...[ authentication, requestValidator(postSchema, "body"), postHandler ]);

export default router;