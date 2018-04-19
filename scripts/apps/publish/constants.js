export const transmissionTypes = {
    ftp: {
        label: 'FTP',
        templateUrl: 'scripts/apps/publish/views/ftp-config.html',
        config: {passive: true},
    },
    email: {
        label: 'Email',
        templateUrl: 'scripts/apps/publish/views/email-config.html',
    },
    ODBC: {
        label: 'ODBC',
        templateUrl: 'scripts/apps/publish/views/odbc-config.html',
    },
    File: {
        label: 'File',
        templateUrl: 'scripts/apps/publish/views/file-config.html',
    },
    http_push: {
        label: 'HTTP Push',
        templateUrl: 'scripts/apps/publish/views/http-push-config.html',
    },
};
