//Execute tests in node enviroment, without dom.
module.exports = {
	testEnvironment: 'node',
	setupFiles: ['<rootDir>/jest.setup.env.cjs'],
	globalSetup: '<rootDir>/_tests_/setup/globalSetup.cjs',
};
