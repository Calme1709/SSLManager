export { default as Operator } from "./base";

export { default as SecretKey } from "./secret_key";

export { default as Server } from "./server";

export { default as Test } from "./test";

export { default as Certificate } from "./certificate";

export { default as Webspace } from "./webspace";

export interface IFilter<FilterType extends string, CustomFilterTypes extends Record<string, any> = Record<string, any>> {
	filterType: FilterType;
	filter: FilterType extends keyof CustomFilterTypes ? CustomFilterTypes[FilterType] : string;
}