
export interface IContactPhoneNumber {
    number?: string;
    usage?: string;
    public?: boolean;
}

export interface IContactType {
    qcode?: string;
    name?: string;
    assignable?: boolean;
}

export interface IContact {
    _id: string;
    is_active?: boolean;
    public?: boolean;
    organisation?: string;
    first_name?: string;
    last_name?: string;
    honorific?: string;
    job_title?: string;
    mobile?: Array<IContactPhoneNumber>;
    contact_phone?: Array<IContactPhoneNumber>;
    fax?: Array<string>;
    contact_email?: Array<string>;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
    contact_address?: Array<string>;
    locality?: string;
    city?: string;
    contact_state?: string;
    postcode?: string;
    country?: string;
    notes?: string;
    contact_type?: string;
}

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
