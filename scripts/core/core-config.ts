export interface IInstanceSettings {
    authoring: {
        editor: {
            version: '2' | '3';
        };
        customToolbar: boolean;
    };

    monitoring: {
        stageCount: Array<string>;
    };
}
