import {IPage} from 'superdesk-api';

export interface IConfiguration {
    addPageToSideMenu?: IPage['addToSideMenu'];
}

export const configuration: IConfiguration = {};

export function configure(_config: IConfiguration) {
    Object.assign(configuration, _config);
}
