// !!!
//
// CODE COMMENT BLOCKS (starting with a forward slash and star)
// IN THIS TYPESCRIPT INTERFACE WILL BE OUTPUTTED TO USER INTERFACE.
//
// Multiple single line comments(like these from line 1 to 9) won't be outputted.
//
// !!!

export interface IInstanceSettings {
    users: {
        /**
         * Time of inactivity in minutes until user is no longer considered online.
         */
        minutesOnline: number;
    };
}
