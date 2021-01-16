import { promises as fs } from "fs";
import { logFile } from "../config";

/**
 * A class responsible for the logging of messages.
 */
export default class Logger {
	/**
	 * Write an error log message.
	 *
	 * @param message - The message to write.
	 */
	public static error(message: string) {
		this.log(message, "ERROR");
	}

	/**
	 * Write a warning log message.
	 *
	 * @param message - The message to write.
	 */
	public static warn(message: string) {
		this.log(message, "WARN");
	}

	/**
	 * Write a log message to the log file and to console if in staging.
	 *
	 * @param message - The message to write.
	 * @param logType - The type of logging this is (error, warning, normal).
	 */
	public static log(message: string, logType: "ERROR" | "NORMAL" | "WARN" = "NORMAL") {
		if(process.env.NODE_ENV === "staging") {
			switch (logType) {
				case "NORMAL":
					console.log(message);
					break;
				case "ERROR":
					console.error(message);
					break;
				case "WARN":
					console.warn(message);
					break;
				default:
					break;
			}
		} else {
			const logEntry = `
				[${new Date().toLocaleString()}]
				${logType === "NORMAL" ? "" : `[${logType}]`}
				${message}
			`;

			fs.appendFile(logFile, logEntry).catch(err => console.error(`Cannot write to log file ${err as string}`));
		}
	}
}