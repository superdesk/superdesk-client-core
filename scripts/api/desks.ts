import {IDesk, IStage} from 'superdesk-api';
import ng from 'core/services/ng';
import {OrderedMap} from 'immutable';

function getActiveDeskId(): IDesk['_id'] | null {
    return ng.get('desks').activeDeskId;
}

function getCurrentDeskId(): IDesk['_id'] | null {
    return ng.get('desks').getCurrentDeskId();
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

function getCurrentUserDesks(): Array<IDesk> {
    return ng.get('desks').userDesks;
}

function getDeskStages(deskId: IDesk['_id']): OrderedMap<IStage['_id'], IStage> {
    let stagesMap: OrderedMap<IStage['_id'], IStage> = OrderedMap();

    for (const stage of ng.get('desks').deskStages[deskId]) {
        stagesMap = stagesMap.set(stage._id, stage);
    }

    return stagesMap;
}

function getDeskById(id: IDesk['_id']): IDesk {
    return getAllDesks().get(id);
}

interface IDesksApi {
    /** Desk is considered active if it is being viewed in monitoring at the moment */
    getActiveDeskId(): IDesk['_id'] | null;
    getCurrentDeskId(): IDesk['_id'] | null;
    waitTilReady(): Promise<void>;
    getAllDesks(): OrderedMap<IDesk['_id'], IDesk>;
    getDeskById(id: IDesk['_id']): IDesk ;
    getDeskStages(deskId: IDesk['_id']): OrderedMap<IStage['_id'], IStage>;
    getCurrentUserDesks(): Array<IDesk>; // desks that current user has access to
}

export const desks: IDesksApi = {
    getActiveDeskId,
    getCurrentDeskId,
    waitTilReady,
    getAllDesks,
    getDeskById,
    getDeskStages,
    getCurrentUserDesks,
};
