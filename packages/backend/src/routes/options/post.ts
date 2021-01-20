import { OptionModel } from "@models/options";
import { Handler } from "@utils/router";

interface IBody {
	options: Array<{
		key: string;
		value: string;
	}>;
}

/**
 * Set options on the server.
 *
 * @param data - The data passed with the HTTP request.
 * @param data.body - The HTTP body passed with the request.
 * @param data.body.options - An object containing the key value pairs that describe the options to set.
 */
const handler: Handler<IBody> = async ({ body: { options } }) => {
	const promises: Array<Promise<void>> = [];

	for(const option of options) {
		promises.push(OptionModel.set(option.key, option.value));
	}

	await Promise.all(promises);
};

export default handler;