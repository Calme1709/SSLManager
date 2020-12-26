import { Operator } from "..";
import { ITheSSLStoreCredentials } from "../../index";

interface IContact {
	AddressLine1: string;
	AddressLine2?: string;
	City: string;
	Country: string;
	Email: string;
	Fax?: string;
	FirstName: string;
	LastName: string;
	OrganizationName: string;
	Phone: string;
	PostalCode: string;
	Region: string;
	Title?: string;
}

interface ITechnicalContact extends IContact {
	SubjectFirstName: string;
	SubjectLastName: string;
}

/**
 * The Order Operator, used for managing all SSL Certificate orders.
 */
export default class Order extends Operator {
	/**
	 * Initialize the order API.
	 *
	 * @param credentials - The credentials to use to communicate with the external TheSSLStore API.
	 */
	public constructor(credentials: ITheSSLStoreCredentials) {
		super("order", credentials);
	}

	/**
	 * Place an order for a new SSL certificate.
	 *
	 * @param csr - The CSR used to place the request.
	 * @param isRenewal - Whether this order is a renewal of an already existing certificate.
	 * @param isTrial - Whether this is a trial order.
	 * @param productCode - The product code of the type of certificate that this order is for.
	 * @param adminContact - The admin contact for this order.
	 * @param technicalContact - The technical contact for this order.
	 *
	 * @returns The response from TheSSLStore API.
	 */
	//eslint-disable-next-line max-params
	public async newOrder(
		csr: string,
		isRenewal: boolean,
		isTrial: boolean,
		productCode: "rapidssl" | "rapidsslwildcard",
		adminContact: IContact,
		technicalContact: ITechnicalContact
	) {
		const response = await this.apiRequest("neworder", {

			//The Email of the person responsible of approving the order
			ApproverEmail: "",

			//The CSR (certificate signing request) associated with this order
			CSR: csr,

			//Whether this is a CU order
			isCUOrder: false,

			//Whether this is a renewal of an already existing certificate
			isRenewalOrder: isRenewal,

			//Whether this order is a trial
			isTrialOrder: isTrial,

			//The product code of the desired certificate to order
			ProductCode: productCode,

			//The number of server licenses
			ServerCount: 1,

			//How long the certificate is valid for in months
			ValidityPeriod: 12,

			//The type of webserver the certificate will be installed on
			WebServerType: "other",

			//The admin contact for this order
			AdminContact: adminContact,

			//The technical contact for this order
			TechnicalContact: technicalContact,

			//The culture to be used for date formatting
			DateTimeCulture: "en-NZ"
		});

		return response;
	}

	/**
	 * Get the status of an order associated with the provided CustomOrderId.
	 *
	 * @param id - The id that was returned when creating the order.
	 *
	 * @returns The status of the order.
	 */
	public status(id: string) {
		interface IResponse {
			AuthResponse: {
				InvokingPartnerCode: string;
				isError: boolean;
				ReplayToken?: string;
				Timestamp: Date;
			};
		}

		const data = {
			TheSSLStoreID: id,
			DateTimeCulture: "en-NZ"
		};

		return this.apiRequest<IResponse>("status", data);
	}
}