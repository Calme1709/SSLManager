import { prop, getModelForClass } from "@typegoose/typegoose";

export interface ICertificateInstance {
	pleskInstance: string;
	location: {
		type: "mail";
	} | {
		type: "controlPanel";
	} | {
		type: "domain";
		domainName: string;
	};
}

export interface ICertificateDetails {
	csr?: string;
	pvt: string;
	cert?: string;
	ca?: string;
}

/**
 * A connection to a remote Plesk instance.
 */
export class SSLCertificate {
	@prop()
	public commonName?: string;

	@prop()
	public certificate!: ICertificateDetails;

	@prop()
	public instances!: ICertificateInstance[];
}

export const SSLCertificateModel = getModelForClass(SSLCertificate);