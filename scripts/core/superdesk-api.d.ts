declare module 'superdesk-api' {
    export interface IExtension {
        activate: (superdesk: ISuperdesk) => void;
    }

    export interface IExtensionObject {
        extension: IExtension;
        manifest: {
            [key: string]: any;
            superdeskExtension?: {
                dependencies?: Array<string>;
            };
        };
    }

    export type IExtensions = {[key: string]: IExtensionObject};

    export interface ISuperdesk {
        ui: {
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
        };
        localization: {
            gettext(message: string): string;
        };
        extensions: {
            getExtension(id: string): Promise<Omit<IExtension, 'activate'>>;
        };
    }
}
