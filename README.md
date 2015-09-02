# Yeti Threads

*A real-time threaded forum micro-service API in Node.js.*

Yeti Threads was written to explore and document a simple and solid approach for micro-service APIs in Node.js. It also happens to be a practical solution to a common need.

## Quick Start

1. Install Postgres
2. git clone https://github.com/andyet/yeti-threads.git
3. cd yeti-threads
4. cp config/example.json config/local.json
5. edit config/local.json
6. set jwtKey. Try something like `console.log(require('crypto').randomBytes(48).toString('base64'));` to generate a value.
7. cp config/local.json config/test.json
8. npm i
9. ./rebuild
10. npm test
11. npm start

## Clients

As of now, there are no clients yet. Have at it!

## Login and Auth Tokens

The API requires the use of [JSON Web Tokens](http://jwt.io/) for authentication.

[Auth0](https://auth0.com) provides a free service which can provide a login page, user management, tokens, and proper redirects back your clint API. Or you can use your own, of course!

## API

The API is a fairly straight forward REST API for forums, threads, posts, access, and activity logs.
It also includes a websocket API for live hints for new/updated resources.

Please read more at [API.md](/API.md)

## Open Source

This project is [MIT Licensed](https://github.com/andyet/yeti-threads/LICENSE).
Feel free to use it as you see fit.
We also accept pull requests!

© 2015 &yet LLC.
