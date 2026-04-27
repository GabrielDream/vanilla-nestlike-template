//spyConsole.js - A collection of stylized console functions for terminal output, including a beep function for alerts, an emergency function for critical messages, and an animateBox function to display text in a stylized manner with delays between lines. These functions utilize the chalk library for color and style enhancements in the terminal.
import chalk from 'chalk';

import { logWarn, logError } from './logger.js';

export const delay = (milliseconds) => new Promise((finish) => setTimeout(finish, milliseconds));

// BEEP: ONLY A STILIZATION IN TERMINAL:
export const beep = async (msg = '📢 BEEEP!') => logWarn(msg);

// ERROR (RED) FUNTION:
export const emergency = async (msg = '🚨 EMERGENCY!') => logError(msg);

export const animateBox = async (text, lineDelay = 200, style = chalk.cyanBright) => {
	const lines = text.split('\n').filter((line) => line.trim() !== '');

	//To each line of text:
	for (const line of lines) {
		console.log(style(line));
		await delay(lineDelay);
	}
};
