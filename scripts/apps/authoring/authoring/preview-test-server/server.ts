// npm install express cors body-parser

const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// parse XML to string
app.use(bodyParser.text({type: 'text/xml'}));

// parse application/json
app.use(bodyParser.json());

app.use(cors());

function getContent(contentType, body) {
    if (contentType.includes('text/xml')) {
        return '<h2>XML received</h2>' + body.replace(/</g, '&lt;');
    } else {
        return `<h1 style="background:yellow">${body['headline']}</h1>${body['body_html']}`;
    }
}

app.post('/preview', (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    /* eslint-disable indent */
    res.send(
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
</head>

<body id="home">
    <div style="max-width: 960px; margin: 0 auto;">
        ${getContent(req.headers['content-type'], req.body)}
    </div>
</body>
</html>`,
    );
});

const port = 5050;

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log('Example app listening on port ' + port);
});
