import app from "./app";
import { port, database } from "@config";
import mongoose from "mongoose";

/**
 * The main function of the program, used due to lack of top level await when compiling for CommonJS Modules.
 */
const main = async () => {
	await mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true, dbName: database.name, useCreateIndex: true });

	app.listen(process.env.PORT ?? port);
};

//eslint-disable-next-line @typescript-eslint/no-floating-promises
main();