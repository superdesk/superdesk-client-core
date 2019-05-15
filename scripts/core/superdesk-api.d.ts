declare module 'superdesk-api' {
    export type IExtension = DeepReadonly<{
        activate: (superdesk: ISuperdesk) => void;
        contribute?: {
            sideMenuItems?: (superdesk: ISuperdesk) => Promise<Array<ISideMenuItem>>
        }
    }>;

    export type ISideMenuItem = DeepReadonly<{
        readonly label: string;
        readonly url: string;
    }>;

    export type IExtensionObject = {
        extension: IExtension;
        manifest: {
            [key: string]: any;
            main: string; // extension will be imported from here
            superdeskExtension?: {
                dependencies?: Array<string>;
            };
        };
        apiInstance?: ISuperdesk;
    };

    export type IExtensions = {[key: string]: IExtensionObject};

    export type ISuperdesk = DeepReadonly<{
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
    }>;
}
