import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	{
		ignores: ['node_modules', 'dist', 'coverage', 'generated', 'prisma', '_tests_']
	},
	js.configs.recommended, // Base recommended ESLint rules.
	{
		plugins: {
			import: pluginImport // Plugin for import-related rules, useful for future import checks.
		},
		languageOptions: { // Defines global variables available in Node.js and Jest.
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.jest
			}
		},
		rules: {
			// Allows console.log / console.error, useful for backend logs.
			'no-console': 'off',

			// Does not force trailing commas.
			'comma-dangle': 'off',

			// Allows names with underscore, such as _id or internal-style names.
			'no-underscore-dangle': 'off',

			// Enforces tabs for indentation.
			indent: ['error', 'tab'],

			// Allows tab characters.
			'no-tabs': 'off',

			// Limits line length to 120 characters.
			'max-len': ['error', { code: 120 }],

			// Does not enforce a specific operator line-break style.
			'operator-linebreak': 'off',

			// Does not enforce function parentheses line-break style.
			'function-paren-newline': 'off',

			// Requires semicolons.
			semi: ['error', 'always'],

			// Reports unused variables, arguments, and caught errors.
			// Currently allows unused names that start with "_".
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},

	eslintConfigPrettier // desativa conflitos com o Prettier
];


//current rules and current errors, lint:fix is not very useful, because most errors need human decision.
