import {IPage, IUser} from 'superdesk-api';

export interface IConfiguration {
    dashboard?: {
        addLinkToSideMenu?: IPage['addToSideMenu'];

        tags?: {
            /**
             * Tags use tree structure. If this option is enabled - only tags that do not have children will be shown.
             */
            leafsOnly?: boolean;
        };
    };

    /**
     * Will be used to determine the order that users are shown in.
     * Returns a number using same rules as callback function that is passed to `Array.sort`
     */
    compareUsers?(a: IUser, b: IUser): number;
}

export const configuration: IConfiguration = {};

export function configure(_config: IConfiguration) {
    Object.assign(configuration, _config);
}
