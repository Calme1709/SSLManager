import app from "./app";
import { port, database } from "@config";
import mongoose from "mongoose";
import { execSync } from "child_process";

/**
 * The main function of the program, used due to lack of top level await when compiling for CommonJS Modules.
 */
const main = async () => {
	//eslint-disable-next-line @typescript-eslint/naming-convention
	const openSSLVersion = execSync("openssl version").toString("utf-8");

	if(!/OpenSSL \d+\.\d+\.\d+[a-z]+.+/g.test(openSSLVersion)) {
		throw new Error("OpenSSL not installed");
	}

	await mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true, dbName: database.name, useCreateIndex: true });

	app.listen(process.env.PORT ?? port);
};

//eslint-disable-next-line @typescript-eslint/no-floating-promises
main();