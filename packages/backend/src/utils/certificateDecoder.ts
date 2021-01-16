import { spawn } from "child_process";
import { ICertificateDetails } from "../models/sslCertificate";

/**
 * Handles all functionality associated with the decoding of elements of SSL certificates.
 */
export default class CertificateDecoder {
	/**
	 * Decode a CSR and retrieve the data that it contains.
	 *
	 * @param csr - The CSR to decode.
	 *
	 * @returns The data stored in the CSR.
	 */
	public static async decodeCertificateRequest(csr: string) {
		const lines = (await this.executeCommand("openssl req -noout -subject -nameopt RFC2253", csr)).split("\n");

		interface ICertificateRequestData {
			emailAddress: string;
			commonName: string;
			organization: string;
			organizationDepartment?: string;
			city: string;
			state: string;
			country: string;
		}

		const subjectNameMap: Record<string, keyof ICertificateRequestData> = {
			emailAddress: "emailAddress",
			CN: "commonName",
			OU: "organizationDepartment",
			O: "organization",
			L: "city",
			ST: "state",
			C: "country"
		};

		return this.decodeOutputLine<ICertificateRequestData>(lines[0], subjectNameMap);
	}

	/**
	 * Decode an SSL certificate.
	 *
	 * @param cert - The certificate to decode.
	 *
	 * @returns The decode certificate.
	 */
	public static async decodeCertificate(cert: string) {
		const data = await this.executeCommand("openssl x509 -noout -issuer -subject -dates -nameopt RFC2253", cert);

		const lines = data.split("\n").filter(line => line !== "");

		const subjectNameMap: Record<string, "commonName"> = {
			CN: "commonName"
		};

		type IssuerInfo = Record<"commonName" | "country" | "organization" | "organizationDepartment", string>;

		const issuerNameMap: Record<string, keyof IssuerInfo> = {
			CN: "commonName",
			OU: "organizationDepartment",
			O: "organization",
			C: "country"
		};

		return {
			issuer: this.decodeOutputLine<IssuerInfo>(lines[0], issuerNameMap),
			subject: this.decodeOutputLine<{ commonName: string }>(lines[1], subjectNameMap),
			notBefore: Date.parse(lines[2].substr(10)),
			notAfter: Date.parse(lines[3].substr(9))
		};
	}

	/**
	 * Get the common name of a certificate from it's components.
	 *
	 * @param certificate - The certificate to extract the domain from.
	 *
	 * @returns The common name.
	 */
	public static async extractDomainFromCert(certificate: Partial<ICertificateDetails>) {
		if(certificate.csr === undefined && certificate.cert === undefined) {
			return undefined;
		}

		if(certificate.csr !== undefined) {
			return (await this.decodeCertificateRequest(certificate.csr)).commonName;
		}

		return (await this.decodeCertificate(certificate.cert!)).subject.commonName;
	}

	/**
	 * Decode an output line that is in the form x=a=b,c=d.
	 *
	 * @param output - The line to decode.
	 * @param nameMap - A map to rename keys (a and c in the example above).
	 *
	 * @returns The decoded data.
	 */
	private static decodeOutputLine<Output>(output: string, nameMap: Record<string, string>): Output {
		const entries = output
			.substr(output.indexOf("=") + 1)
			.split(",")
			.map(entry => entry.split("="))
			.map(([ key, value ]) => [ nameMap[key], value ]);

		return Object.fromEntries(entries) as Output;
	}

	/**
	 * Execute a command in the shell and return the output.
	 *
	 * @param command - The command to execute.
	 * @param stdin - The data to write to STDIN.
	 *
	 * @returns A promise which resolves to the output of the command.
	 */
	private static executeCommand(command: string, stdin?: string) {
		const [ process, ...args ] = command.split(" ");

		return new Promise<string>((resolve, reject) => {
			const proc = spawn(process, args);

			proc.stdout.on("data", (data: string) => resolve(data.toString()));
			proc.stderr.on("data", data => reject(new Error(data)));

			if(stdin !== undefined) {
				proc.stdin.write(stdin);
				proc.stdin.end();
			}
		});
	}
}