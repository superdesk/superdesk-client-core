import {IDesk, IStage, IUser} from 'superdesk-api';
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

    // may be called before `desks.initialize()` has resolved
    for (const desk of ng.get('desks').desks?._items ?? []) {
        desksMap = desksMap.set(desk._id, desk);
    }

    return desksMap;
}

function getCurrentUserDesks(): Array<IDesk> {
    return ng.get('desks').userDesks;
}

function getDeskStages(deskId: IDesk['_id'] | null | undefined): OrderedMap<IStage['_id'], IStage> {
    let stagesMap: OrderedMap<IStage['_id'], IStage> = OrderedMap();

    // callers reach this with no desk (a personal-space item has no `task.desk`); without the
    // early return the lookup would be `deskStages['null']`
    if (deskId == null) {
        return stagesMap;
    }

    // `deskStages` is empty until `desks.initialize()` resolves, and has no entry
    // for a desk the current user can not see
    for (const stage of ng.get('desks').deskStages?.[deskId] ?? []) {
        stagesMap = stagesMap.set(stage._id, stage);
    }

    return stagesMap;
}

function getDeskById(id: IDesk['_id']): IDesk {
    return getAllDesks().get(id);
}

/**
 * The stage list carries `default_incoming` and the desk record carries `incoming_stage`. They
 * agree, but the stage list is empty until the desks store resolves and for desks the current user
 * can not see, so the desk record is used as the fallback before giving up.
 */
function getDeskDefaultIncomingStageId(deskId: IDesk['_id'] | null | undefined): IStage['_id'] | null {
    if (deskId == null) {
        return null;
    }

    const defaultIncomingStage = getDeskStages(deskId).find((stage) => stage.default_incoming === true);

    return defaultIncomingStage?._id ?? getDeskById(deskId)?.incoming_stage ?? null;
}

function getDeskMembers(deskId: IDesk['_id']): Array<IUser> {
    return ng.get('desks').deskMembers[deskId] ?? [];
}

function getStageById(id: IStage['_id']): IStage {
    return ng.get('desks').stageLookup[id];
}

interface IDesksApi {
    /** Desk is considered active if it is being viewed in monitoring at the moment */
    getActiveDeskId(): IDesk['_id'] | null;
    getCurrentDeskId(): IDesk['_id'] | null;
    waitTilReady(): Promise<void>;
    getAllDesks(): OrderedMap<IDesk['_id'], IDesk>;
    getDeskById(id: IDesk['_id']): IDesk ;
    getDeskStages(deskId: IDesk['_id'] | null | undefined): OrderedMap<IStage['_id'], IStage>;

    /** `null` when the desk, or the desks store itself, is not available */
    getDeskDefaultIncomingStageId(deskId: IDesk['_id'] | null | undefined): IStage['_id'] | null;
    getCurrentUserDesks(): Array<IDesk>; // desks that current user has access to
    getDeskMembers(deskId: IDesk['_id']): Array<IUser>; // members of the desk
    getStageById(id: IStage['_id']): IStage;
}

export const desks: IDesksApi = {
    getActiveDeskId,
    getCurrentDeskId,
    waitTilReady,
    getAllDesks,
    getDeskById,
    getDeskStages,
    getDeskDefaultIncomingStageId,
    getCurrentUserDesks,
    getDeskMembers,
    getStageById,
};
