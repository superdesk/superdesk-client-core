export interface ISuperdeskGlobalConfig {
    defaultRoute: string;
    features: {
        swimlane: {
            columnsLimit: number;
        };
        editor3: boolean;
        qumu: boolean;
        savedSearch: {
            subscriptions: boolean;
        }
    };
    auth: {
        google: boolean,
    };
    ingest: {
        PROVIDER_DASHBOARD_DEFAULTS: {
            show_log_messages: boolean;
            show_ingest_count: boolean;
            show_time: boolean;
            log_messages: 'error';
            show_status: boolean;
        }
        DEFAULT_SCHEDULE: {
            minutes: number;
            seconds: number;
        }
        DEFAULT_IDLE_TIME: {
            hours: number;
            minutes: number;
        };
    };
}
