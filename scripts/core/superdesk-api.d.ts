declare module 'superdesk-api' {
    export interface ISuperdesk {
        ui: {
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
        };
        localization: {
            gettext(message: string): string;
        }
    }
}
