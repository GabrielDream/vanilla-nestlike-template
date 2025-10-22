import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import pluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	{
		ignores: ['node_modules/**', 'generated/**', 'prisma/**'],
	},
	js.configs.recommended,
	{
		plugins: {
			import: pluginImport,
			prettier: pluginPrettier,
		},
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
		rules: {
			'no-console': 'off',
			'comma-dangle': 'off',
			'no-underscore-dangle': 'off',
			indent: ['error', 'tab'],
			'no-tabs': 'off',
			'max-len': ['error', { code: 120 }],
			'operator-linebreak': 'off',
			'function-paren-newline': 'off',
			'prettier/prettier': 'error',
			'no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			}],
		},
	},
	// desativa conflitos com o Prettier
	eslintConfigPrettier,
];
