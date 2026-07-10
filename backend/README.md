# NexoCRM Mock API

API local sem banco de dados para preparar o front para um backend real.

## Rodar

```bash
node backend/mock-server.js
```

Por padrao ela sobe em:

```txt
http://127.0.0.1:3333
```

## Rotas

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /clients`
- `POST /clients`
- `PUT /clients/:id`
- `DELETE /clients/:id`
- `GET /team`
- `POST /team`
- `GET /settings`
- `PUT /settings`
- `GET /plans`
- `GET /reports/summary`
- `POST /assistant/suggest`

## Observacoes

- Nao usa banco de dados.
- Nao grava em arquivo.
- Tudo fica em memoria e reseta quando o servidor reinicia.
- A autenticacao usa token mock em memoria.
- A senha ainda e texto puro porque este servidor e apenas demonstrativo.

## Uso pelo front

No painel, abra `Config > Conexao com API mock`, selecione `Backend mock`, mantenha a URL `http://127.0.0.1:3333` e use:

- `Testar conexao`
- `Importar demo da API`

O front continua salvando a demo localmente, mas consegue validar a API e importar dados do servidor mock.
