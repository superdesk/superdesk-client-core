module.exports = function buildIndex(o) {
    return `
        <!doctype html>
        <html class="no-js">
          <head>
            <meta charset="utf-8">
            <title>Superdesk</title>
            <meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
            ${o.qumu ? '<script src="https://video.fidelity.tv/widgets/1/application.js"></script>' : ''}
            <link rel="icon" type="image/x-icon" href="images/favicon.ico" />
          </head>
          <body ng-class="config.bodyClass">
            <div sd-superdesk-view></div>
            <script src="app.bundle.js"></script>
            <script src="config.js"></script>
          </body>
        </html>
    `;
};
