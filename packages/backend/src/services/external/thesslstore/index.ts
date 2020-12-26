import { Operator, Order } from "./operators";
import { OptionModel } from "../../../models/options";
import { ControlledError } from "@utils";

type OperatorName = "order";

export interface ITheSSLStoreCredentials {
	authToken: string;
	partnerCode: string;
}

class TheSSLStore {
	private readonly operatorCache: { [key in OperatorName]?: Operator } = {};

	private credentials!: ITheSSLStoreCredentials;

	/**
	 * Connect to the TheSSLStore API.
	 */
	public async connect() {
		const authToken = await OptionModel.findOne({ key: "TheSSLStoreAuthToken" });
		const partnerCode = await OptionModel.findOne({ key: "TheSSLStorePartnerCode" });

		if(authToken === null || partnerCode === null) {
			throw new ControlledError(403, "No TheSSLStore credentials have been saved");
		}

		this.credentials = {
			authToken: authToken.value,
			partnerCode: partnerCode.value
		};
	}

	/**
	 * Get the order operator.
	 *
	 * @returns The order operator.
	 */
	public get order() {
		return this.getOperator("order") as Order;
	}

	/**
	 * Get the operator with the supplied name.
	 *
	 * @param operatorName - The name of the operator.
	 *
	 * @returns The operator.
	 */
	private getOperator(operatorName: OperatorName) {
		if(operatorName in this.operatorCache) {
			return this.operatorCache[operatorName];
		}

		let operator: Operator | undefined;

		switch (operatorName) {
			case "order":
				operator = new Order(this.credentials);
				break;

			default:
				break;
		}

		this.operatorCache[operatorName] = operator;

		return operator;
	}
}

/**
 * Get a connection to the Api of TheSSLStore.
 *
 * @returns A connection to the Api of TheSSLStore.
 */
const getTheSSLStoreApi = async () => {
	const api = new TheSSLStore();

	await api.connect();

	return api;
};

export default getTheSSLStoreApi;