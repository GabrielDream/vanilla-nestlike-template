//Execute tests in node enviroment, without dom.
module.exports = {
	testEnvironment: 'node',
	setupFiles: ['<rootDir>/jest.setup.env.cjs'],
	globalSetup: '<rootDir>/_tests_/setup/globalSetup.cjs'
};

/*⚙️ 1. jest.config.cjs

Define que o Jest roda em ambiente Node puro (testEnvironment: 'node'), sem simular navegador. Não o JSDOM (simulador de navegador).

O Jest precisa saber em que tipo de ambiente executar os testes, não o banco em si. Difente do Mongoose, que já roda na memoria do Node, automaticamente.

Diz ao Jest para:
Carregar variáveis de ambiente de teste via jest.setup.env.cjs (setupFiles).
Executar o script global globalSetup.cjs antes de iniciar os testes.

👉 ELE É O MAPA QUE CONECTA TUDO!!.*/
