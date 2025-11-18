import express from 'express';
import { logInfo, logSuccess } from '../../terminalStylization/logger.js';
import successHandler from '../../middlewares/successHandler.js';
import supertest from 'supertest';

const app = express();

app.use(successHandler);

//Running supertest:
const request = supertest(app);

//Route:
app.get('/success', (req, res, next) => {
	res.success({
		message: 'Test worked!'
	});
});

app.get('/default-success', (req, res) => {
	res.success(); // ⬅️ Sem parâmetros - testa os defaults
});

describe('Testing middleware success function', () => {
	test('should return success response', async () => {
		const response = await request.get('/success');

		logInfo('TESTING MIDDLEWARE SUCCESS');
		expect(response.status).toBe(200);
		expect(response.body.status).toBe('Success');
		expect(response.body.message).toBe('Test worked!');
		logSuccess('ALL WORKED!');
	});

	test('should use default values when no options', async () => {
		const response = await request.get('/default-success');
		expect(response.body.message).toBe('Success'); // default
	});
});
