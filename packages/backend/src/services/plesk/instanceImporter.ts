import getPleskApi, { IPleskCredentials } from "@services/external/plesk/";
import { PleskConnectionModel } from "@models/pleskConnection";
import { SSLCertificateModel, ICertificateInstance, SSLCertificate, ICertificateDetails } from "@models/sslCertificate";
import { CertificateDecoder, Writable } from "@utils";
import PleskWebScraper from "./webscraper";
import { DocumentType } from "@typegoose/typegoose";
import { UpdateQuery } from "mongoose";

/**
 * This class handles the importing of plesk instances into the application.
 */
export default class PleskInstanceImporter {
	/**
	 * Import a remote Plesk instance into the application.
	/**
	 * Add an initialize a new Plesk instance.
	 *
	 * @param friendlyName - The friendly name of this server, will be used in most situations that is user facing instead of the hostname.
	 * @param ipAddress - The IP of the remote Plesk instance that is being added.
	 * @param credentials - The credentials that are used to log in to the new remote Plesk instance.
	 * @param useHttps - Whether to use HTTPS instead of HTTP when accessing the server.
	 */
	public static async import(friendlyName: string, ipAddress: string, credentials: IPleskCredentials, useHttps: boolean) {
		const connection = await getPleskApi(ipAddress, credentials);

		const apiKeyDescription = "API Key that is used by the SSLManager program for any interaction it has with this Plesk instance";

		const apiKey = await connection.secret_key.create(undefined, apiKeyDescription);

		await PleskConnectionModel.create({
			friendlyName,
			login: credentials.login,
			ipAddress,
			apiKey,
			useHttps,
			sessionInfo: {
				expiration: 0,
				cookie: ""
			}
		});

		await this.fetchDomainCertificates(ipAddress);

		//TODO: Import plesk control panel and mail certificate aswell.
	}

	/**
	 * Fetch the SSL certificates that are present on the remote Plesk instance and save them to the database.
	 *
	 * @param ip - The IP address of the remote plesk instance.
	 */
	private static async fetchDomainCertificates(ip: string) {
		const connection = await getPleskApi(ip);
		const webScraper = new PleskWebScraper(ip);

		const domains = (await connection.server.get())["admin-domain-list"].domain.filter(({ type }) => type !== "alias");

		for await (const domain of domains) {
			const cert = await webScraper.getDomainActiveCertDetails(domain.id);

			if(cert === undefined) {
				continue;
			}

			const { name: {}, ...certDetails } = cert;

			const exisingEntry = await SSLCertificateModel.findOne({
				$and: [
					certDetails.csr === undefined ? {} : this.orQuery("certificate.csr", [ certDetails.csr, { $exists: false } ]),
					{ "certificate.pvt": certDetails.pvt },
					certDetails.cert === undefined ? {} : this.orQuery("certificate.cert", [ certDetails.cert, { $exists: false } ]),
					certDetails.ca === undefined ? {} : this.orQuery("certificate.ca", [ certDetails.ca, { $exists: false } ])
				]
			});

			const instance: ICertificateInstance = {
				pleskInstance: ip,
				location: { type: "domain", domainName: domain.name	}
			};

			if(exisingEntry === null) {
				await this.createNewCertificateEntry(certDetails, instance);
			} else {
				await this.updateExistingCertificateEntry(exisingEntry, certDetails, instance);
			}
		}
	}

	/**
	 * Create an SSL certificate entry in the database.
	 *
	 * @param certDetails - The details about the certificate.
	 * @param instance - The information about the plesk instance.
	 */
	private static async createNewCertificateEntry(certDetails: ICertificateDetails, instance: ICertificateInstance) {
		const commonName = await CertificateDecoder.extractDomainFromCert(certDetails);

		await SSLCertificateModel.create({
			certificate: certDetails,
			commonName,
			instances: [ instance ]
		});
	}

	/**
	 * Update an already existing SSL certificate entry to reflect the new information gathered about it from the newly imported
	 * Plesk instance.
	 *
	 * @param existingEntry - The mongoose document for the already existing entry.
	 * @param certDetails - The details about the certificate.
	 * @param instance - The information about the plesk instance.
	 */
	private static async updateExistingCertificateEntry(
		existingEntry: DocumentType<SSLCertificate>,
		certDetails: ICertificateDetails,
		instance: ICertificateInstance
	) {
		const updateQuery: Writable<UpdateQuery<DocumentType<SSLCertificate>>> = {
			$push: { instances: instance }
		};

		for(const component of [ "csr", "cert", "ca" ] as [ "csr", "cert", "ca" ]) {
			if(certDetails[component] !== undefined && existingEntry.certificate[component] === undefined) {
				updateQuery[`certificate.${component}`] = certDetails[component];
			}
		}

		if(existingEntry.commonName === undefined) {
			updateQuery.commonName = await CertificateDecoder.extractDomainFromCert(certDetails);
		}

		existingEntry.updateOne(updateQuery);
	}

	/**
	 * A more elegant (in my opinion) way to create an or query for mongodb.
	 *
	 * @param selector - The selector.
	 * @param values - The possible values.
	 *
	 * @returns The query.
	 */
	private static async orQuery(selector: string, values: unknown[]) {
		return { $or: values.map(value => ({ [selector]: value })) };
	}
}