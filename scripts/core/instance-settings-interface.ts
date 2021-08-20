// !!!
//
// CODE COMMENT BLOCKS (starting with a forward slash and star)
// IN THIS TYPESCRIPT INTERFACE WILL BE OUTPUTTED TO USER INTERFACE.
//
// Multiple single line comments(like these from line 1 to 9) won't be outputted.
//
// !!!

export interface IInstanceSettings {
    authoring: {
        editor: {
            /**
             * Version 2 is deprecated.
             */
            version: '2' | '3';
        };
        customToolbar: boolean;
    };

    monitoring: {
        stageCount: Array<string>;
    };
}
