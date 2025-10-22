import express from 'express';
import { logInfo, logSuccess } from '../../terminalStylization/logger.js';
import successHandler from '../../middlewares/successHandler.js';

const app = express();

app.use(successHandler);

//Route:
app.get('/success', (req, res, next) => {
	res.success({
		message: 'Test worked!',
	});
});

//Running supertest:
import supertest from 'supertest';
const request = supertest(app);

describe('Testing middleware success function', () =>
	test('should return success response', async () => {
		const response = await request.get('/success');

		logInfo('TESTING MIDDLEWARE SUCCESS');

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('Success');
		expect(response.body.message).toBe('Test worked!');
		logSuccess('ALL WORKED!');
	}));
