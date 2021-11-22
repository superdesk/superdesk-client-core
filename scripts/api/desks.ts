import {IDesk, IStage} from 'superdesk-api';
import ng from 'core/services/ng';
import {OrderedMap} from 'immutable';

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

function getAllDesks(): OrderedMap<IDesk['_id'], IDesk> {
    let desksMap: OrderedMap<IDesk['_id'], IDesk> = OrderedMap();

    for (const desk of ng.get('desks').desks._items) {
        desksMap = desksMap.set(desk._id, desk);
    }

    return desksMap;
}

function getDeskStages(deskId: IDesk['_id']): OrderedMap<IStage['_id'], IStage> {
    let stagesMap: OrderedMap<IStage['_id'], IStage> = OrderedMap();

    for (const stage of ng.get('desks').deskStages[deskId]) {
        stagesMap = stagesMap.set(stage._id, stage);
    }

    return stagesMap;
}

interface IDesksApi {
    getActiveDeskId(): IDesk['_id'] | null;
    waitTilReady(): Promise<void>;
    getAllDesks(): OrderedMap<IDesk['_id'], IDesk>;
    getDeskStages(deskId: IDesk['_id']): OrderedMap<IStage['_id'], IStage>;
}

export const desks: IDesksApi = {
    getActiveDeskId,
    waitTilReady,
    getAllDesks,
    getDeskStages,
};
