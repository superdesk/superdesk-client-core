import {IPage} from 'superdesk-api';

export interface IConfiguration {
    dashboard?: {
        addLinkToSideMenu?: IPage['addToSideMenu'];

        tags?: {
            /**
             * Tags use tree structure. If this option is enabled - only tags that do not have children will be shown.
             */
            leafsOnly?: boolean;
        };
    }
}

export const configuration: IConfiguration = {};

export function configure(_config: IConfiguration) {
    Object.assign(configuration, _config);
}
