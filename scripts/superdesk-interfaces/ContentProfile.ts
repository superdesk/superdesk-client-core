export interface IContentProfile {
    _id: string;
    label: string;
    description: string;
    schema: object;
    editor: object;
    widgets_config: Array<{widget_id: string; is_displayed: boolean}>;
    priority: number;
    enabled: boolean;
    is_used: boolean;
    created_by: string;
    updated_by: string;
}
