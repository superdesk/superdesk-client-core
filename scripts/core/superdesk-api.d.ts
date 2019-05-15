declare module 'superdesk-api' {
    export type IExtension = DeepReadonly<{
        activate: (superdesk: ISuperdesk) => Promise<void>;
        contribute?: {
            sideMenuItems?: (superdesk: ISuperdesk) => Promise<Array<ISideMenuItem>>;
            pages?: Array<IPage>;
        };
    }>;

    export type ISideMenuItem = DeepReadonly<{
        label: string;
        url: string;
    }>;

    export type IPage = DeepReadonly<{
        url: string;
        component: React.ComponentClass<IPageComponentProps>;
    }>;

    export interface IPageComponentProps {
        superdesk: ISuperdesk;
    }

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
