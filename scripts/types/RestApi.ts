export interface IRestApiLink {
    title: string;
    href: string;
}

export interface IDefaultApiFields {
    _created: string;
    _updated: string;
    _etag: string;
    _id: string;
}

// Eve properties
export interface IRestApiResponse<T extends IDefaultApiFields> {
    _items: Array<T>;
    _links: {
        parent: IRestApiLink;
        selft: IRestApiLink;
    };
    _meta: {
        max_results: number;
        page: number;
        total: number;
    };
}
