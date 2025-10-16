import {IContact} from 'superdesk-api';

export interface IContactsService {
    getCriteria(param: any): {
        max_results: number,
        sort: string,
        page: number,
        all: boolean,
        q?: string,
        default_operator?: string,
        filter?: string,
    };
    query(param: any): Promise<{_items: Array<IContact>}>;
    queryField(field: string, text: string): Promise<{_items: Array<IContact>}>;
    toggleStatus(contact: IContact, active: boolean): Promise<IContact>;
    togglePublic(contact: IContact, isPublic: boolean): Promise<IContact>;
    save(contact: IContact, updates: IContact): Promise<IContact>;
    convertForClient(contact: IContact): IContact;

    sortOptions: Array<{
        field: string;
        label: string;
        defaultDir: string;
    }>;
    twitterPattern: string;
    privacyOptions: Array<{
        name: string;
        value: string;
    }>;
    statusOptions: Array<{
        name: string;
        value: string;
    }>;
}
