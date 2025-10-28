//Load new env only for tests
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

/*Carrega o arquivo .env.test, que contém a URL do banco exclusivo de testes e NODE_ENV=test.

Isso garante que todas as conexões durante os testes usem o banco certo (não o de dev).

👉 Atua como o “carregador” de ambiente isolado. É O TROCADOR DE ENVS ANTES DOS TESTES*/
