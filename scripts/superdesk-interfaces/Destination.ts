export interface IDestination {
    name: string;
    delivery_type: 'email' | string;
    format: 'ninjs' | string;
    config?: {
        recipients: string;
    };
    preview_endpoint_url?: string;
}
