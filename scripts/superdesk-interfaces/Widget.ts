export interface IWidget {
    _id: string;
    icon: string;
    label: string;
    order: number;
    removeHeader: boolean;
    side: string;
    template: string;
    display: {
        archived: boolean;
        authoring: boolean;
        killedItem: boolean;
        legalArchive: boolean;
        packages: boolean;
        personal: boolean;
        picture: boolean;
    };
}
