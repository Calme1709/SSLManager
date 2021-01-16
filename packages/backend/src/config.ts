export const database = {
	url: process.env.NODE_ENV === "staging" ? "mongodb://localhost:27017" : "mongodb://mongo:27017",
	name: "SSLManager"
};

export const TheSSLStoreURL = "https://sandbox-wbapi.thesslstore.com/";

export const jwtSecret = "hello";
export const port = process.env.NODE_ENV === "staging" ? 8080 : 80;
export const logFile = "/var/log/sslmanager/backend.log";