import {IDesk} from 'superdesk-api';
import ng from 'core/services/ng';

function getActiveDeskId(): IDesk['_id'] | null {
    return ng.get('desks').activeDeskId;
}

function waitTilReady(): Promise<void> {
    return new Promise((resolve) => {
        ng.get('desks')
            .initialize()
            .then(() => {
                // Let other code run first (specifically AngularJS code)
                setTimeout(resolve, 50);
            });
    });
}

interface IDesksApi {
    getActiveDeskId(): IDesk['_id'] | null;
    waitTilReady(): Promise<void>;
}

export const desks: IDesksApi = {
    getActiveDeskId,
    waitTilReady,
};
