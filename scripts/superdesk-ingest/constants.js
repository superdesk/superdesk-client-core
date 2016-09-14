export const feedingServices = [
    {
        value: 'file',
        label: 'File Feed',
        templateUrl: 'scripts/superdesk-ingest/views/settings/fileConfig.html'
    },
    {
        value: 'reuters_http',
        label: 'Reuters Feed API',
        templateUrl: 'scripts/superdesk-ingest/views/settings/reutersConfig.html',
        config: {
            url: 'http://rmb.reuters.com/rmd/rest/xml',
            auth_url: 'https://commerce.reuters.com/rmd/rest/xml/login'
        }
    },
    {
        value: 'rss',
        label: 'RSS',
        templateUrl: 'scripts/superdesk-ingest/views/settings/rssConfig.html'
    },
    {
        value: 'ftp',
        label: 'FTP',
        templateUrl: 'scripts/superdesk-ingest/views/settings/ftp-config.html',
        config: {passive: true}
    },
    {
        value: 'email',
        label: 'Email',
        templateUrl: 'scripts/superdesk-ingest/views/settings/emailConfig.html'
    }
];

export const feedParsers = [
    {value: 'email_rfc822', name: 'EMail RFC822 Parser'},
    {value: 'nitf', name: 'NITF Parser'},
    {value: 'newsml12', name: 'News ML 1.2 Parser'},
    {value: 'afpnewsml12', name: 'AFP News ML 1.2 Parser'},
    {value: 'newsml2', name: 'News ML-G2 Parser'},
    {value: 'scoop_newsml2', name: 'Scoop Media News ML-G2 Parser'},
    {value: 'wenn', name: 'WENN Parser'},
    {value: 'anpa1312', name: 'ANPA Parser'},
    {value: 'iptc7901', name: 'IPTC 7901 Parser'},
    {value: 'dpa_iptc7901', name: 'DPA IPTC 7901 Parser'},
    {value: 'ap_anpa1312', name: 'AP ANPA parser'},
    {value: 'pa_nitf', name: 'PA NITF'}
];

export const PROVIDER_DASHBOARD_DEFAULTS = {
    show_log_messages: true,
    show_ingest_count: true,
    show_time: true,
    log_messages: 'error',
    show_status: true
};

export const DEFAULT_SCHEDULE = {minutes: 5, seconds: 0};
export const DEFAULT_IDLE_TIME = {hours: 0, minutes: 0};
