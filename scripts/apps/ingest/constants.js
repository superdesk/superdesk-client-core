/**
 * TODO: this can eventually be replaced with a service function to 
 * dynamically lookup allowed services:
 *
 * see: IngestProvidersService.fetchAllFeedingServicesAllowed()
 * However, we should to decide how to deal with the templateUrl 
 * and config definitions dynamically before doing this, as I do
 * not think keeping those values in the superdesk-core is
 * appropriate.  
 */
export const feedingServices = [
    {
        value: 'file',
        label: 'File Feed',
        templateUrl: 'scripts/apps/ingest/views/settings/fileConfig.html'
    },
    {
        value: 'reuters_http',
        label: 'Reuters Feed API',
        templateUrl: 'scripts/apps/ingest/views/settings/reutersConfig.html',
        config: {
            url: 'http://rmb.reuters.com/rmd/rest/xml',
            auth_url: 'https://commerce.reuters.com/rmd/rest/xml/login'
        }
    },
    {
        value: 'rss',
        label: 'RSS',
        templateUrl: 'scripts/apps/ingest/views/settings/rssConfig.html'
    },
    {
        value: 'ftp',
        label: 'FTP',
        templateUrl: 'scripts/apps/ingest/views/settings/ftp-config.html',
        config: {passive: true}
    },
    {
        value: 'email',
        label: 'Email',
        templateUrl: 'scripts/apps/ingest/views/settings/emailConfig.html'
    }
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
