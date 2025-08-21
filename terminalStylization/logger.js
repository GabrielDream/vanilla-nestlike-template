import chalk from "chalk";

const label = {
	info: chalk.greenBright('⚪  INFO: '),
	debug: chalk.blueBright('🔵  DEBUG: '),
	// logs for errors:
	warn: chalk.yellowBright('🟡  WARNING: '),
	error: chalk.redBright('🔴  ERROR: '),
	// Logs for sucess:
	sucess: chalk.greenBright('🟢  SUCCESS: '),
	data: chalk.blueBright('📦  DATA: '),
	timestamp: chalk.gray('🕒  Timestamp: ')
}

const logInfo = (msg) => console.log(`${label.info} - ${msg}`);
const logDebug = (msg) => console.log(`${label.debug} - ${msg}`);
const logWarn = (msg) => console.log(`${label.warn} - ${msg}`);
const logError = (msg) => console.log(`${label.error} - ${msg}`);
const logSuccess = (msg) => console.log(`${label.sucess} - ${msg}`);
const logData = (data) => console.log(`${label.data} -`, data);
const logTimeStamp = (timestamp) => console.log(`${label.timestamp} -`, timestamp);

const logBanner = (msg, style = chalk.bgGreenBright.bold) => {
	const line = "=".repeat(msg.lenght + 10);
	console.log((`\n${line}\n ${msg.toUpperCase()}\n${line}\n`));
}

export {
	logInfo, logDebug, logWarn, logError, logSuccess, logData, logTimeStamp, logBanner
}
