import { createLogger, type LoggerConfig } from "@yourcompany/backend-core/log";
import { appConfig } from "#config";

const config: LoggerConfig = {
  env: appConfig.env,
};
export const logger = createLogger(config);
