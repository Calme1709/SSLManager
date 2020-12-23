import Operator from "./base";
import { PleskApi } from "..";
import { IFilter } from "./index";

//eslint-disable-next-line max-len
type SiteFilterType = "id" | "parent-id" | "parent-site-id" | "name" | "parent-name" | "parent-site-name" | "guid" | "parent-guid" | "parent-site-guid";

type SiteFilter = IFilter<SiteFilterType, { id: number; "parent-id": number; "parent-side-id": number }>;

/**
 * The operator for managing sites (domains).
 */
export default class Session extends Operator<"site"> {
	/**
	 * Initialize the site operator.
	 *
	 * @param pleskApi - The plesk API instance this operator is associated with.
	 */
	public constructor(pleskApi: PleskApi) {
		super("site", pleskApi);
	}

	/**
	 * Get information about sites that match a filter.
	 *
	 * @param filter - The filter for which sites to get information about.
	 *
	 * @returns Information about the sites.
	 */
	public async get(filter: SiteFilter) {
		const result = await this.xmlApiRequest("get", [
			this.createDataNode(
				"filter",
				this.createDataNode(filter.type, filter.value.toString())
			),
			this.createDataNode(
				"dataset",
				[
					this.createDataNode("gen_info", ""),
					this.createDataNode("hosting", ""),
					this.createDataNode("stat", ""),
					this.createDataNode("prefs", ""),
					this.createDataNode("disk_usage", ""),
					this.createDataNode("performance", "")
				]
			)
		]);

		return result;
	}

	/**
	 * Terminate an ongoing Plesk Control Panel session.
	 *
	 * @param sessionId - The ID of the session to terminate.
	 *
	 * @returns Whether or not the termination was successful.
	 */
	public async terminate(sessionId: string) {
		interface IResponse {
			status: "ok" | "error";
		}

		const result = await this.xmlApiRequest<IResponse, string>("terminate", this.createDataNode("session-id", sessionId));

		return result.status === "ok";
	}
}