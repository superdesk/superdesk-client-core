export const transmissionTypes = {
    ftp: {
        label: 'FTP',
        templateUrl: 'scripts/superdesk-publish/views/ftp-config.html',
        config: {passive: true}
    },
    email: {
        label: 'Email',
        templateUrl: 'scripts/superdesk-publish/views/email-config.html'
    },
    ODBC: {
        label: 'ODBC',
        templateUrl: 'scripts/superdesk-publish/views/odbc-config.html'
    },
    File: {
        label: 'File',
        templateUrl: 'scripts/superdesk-publish/views/file-config.html'
    },
    pull: {
        label: 'Pull'
    },
    http_push: {
        label: 'HTTP Push',
        templateUrl: 'scripts/superdesk-publish/views/http-push-config.html'
    }
};
