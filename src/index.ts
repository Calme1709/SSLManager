import app from "./app";
import { port, database } from "@config";
import mongoose from "mongoose";

//eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
	await mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true, dbName: database.name, useCreateIndex: true });

	app.listen(process.env.PORT ?? port);
})();