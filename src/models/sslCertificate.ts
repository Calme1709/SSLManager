import { IOrganizationalInfo, ICertificateContent } from "@services/external/plesk/operators/certificate";
import { prop, getModelForClass } from "@typegoose/typegoose";

/**
 * A connection to a remote Plesk instance.
 */
export class SSLCertificate {
	@prop({ unique: true })
	public name!: string;

	@prop()
	public domain!: string;

	@prop()
	public productCode!: string;

	@prop()
	public organizationalInfo!: IOrganizationalInfo;

	@prop()
	public certificate!: ICertificateContent;

	@prop()
	public relatedWebspaces!: Array<{ pleskInstance: string; domainName: string }>;
}

export const SSLCertificateModel = getModelForClass(SSLCertificate);