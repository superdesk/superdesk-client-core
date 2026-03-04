1. Pull the latest changes from develop
2. cd superdesk-client-core
3. npm ci
4. Open e2e/client/superdesk.config.js

To work against a remote backend add inside the config:
```
server: {
    "url": "https://sd-develop.test.superdesk.org/api",
    "ws": "ws://sd-develop.test.superdesk.org:5150/ws"
},
```
You can also use any other backend from the instances on https://test.superdesk.org/

5. Open e2e/client/index.js
6. Remove the custom font styles
7. cd e2e/client
8. npm run server
