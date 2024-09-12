import {IArticle, IDesk, IStage, OrderedMap} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {sdApi} from 'api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ISendToDestination} from '../interfaces';

export function getInitialDestination(
    items: Array<IArticle>,
    canSendToPersonal: boolean,
    availableDesks: OrderedMap<string, IDesk> = sdApi.desks.getAllDesks(),
): ISendToDestination {
    const lastDestination: ISendToDestination | null = sdApi.preferences.get('destination:active');

    if (canSendToPersonal && lastDestination?.type === 'personal-space') {
        return lastDestination;
    }

    const currentDeskId = sdApi.desks.getCurrentDeskId();

    let destinationDesk: string = (() => {
        if (lastDestination?.type === 'desk' && lastDestination.desk != null) {
            return lastDestination.desk;
        } else if (currentDeskId != null) {
            return currentDeskId;
        } else if (items.length === 1 && items[0].task?.desk != null) {
            return items[0].task.desk;
        } else {
            return availableDesks.first()?._id ?? null;
        }
    })();

    // If destinationDesk isn't found in availableDesks we set the
    // destinationDesk to the first item from availableDesks
    if (!availableDesks.has(destinationDesk)) {
        destinationDesk = availableDesks.first()?._id;
    }

    if (destinationDesk == null) {
        return {
            type: 'desk',
            desk: null,
            stage: null,
        };
    }

    const deskStages = sdApi.desks.getDeskStages(destinationDesk);

    const destinationStage: IStage['_id'] = (() => {
        const {sendDefaultStage} = appConfig.ui;
        let result: IStage | null = null;

        if (sendDefaultStage != null) {
            result = deskStages.find((stage) => {
                if (sendDefaultStage === 'incoming') {
                    return stage.default_incoming === true;
                } else if (sendDefaultStage === 'working') {
                    return stage.working_stage === true;
                } else {
                    return assertNever(sendDefaultStage);
                }
            });
        }

        if (result == null && lastDestination?.type === 'desk' && lastDestination.stage != null) {
            result = deskStages.find((stage) => stage._id === lastDestination.stage);
        }

        if (result == null) {
            result = deskStages.find((stage) => stage.default_incoming === true);
        }

        if (result == null) {
            result = deskStages.first();
        }

        return result?._id ?? null;
    })();

    const destination: ISendToDestination = {
        type: 'desk',
        desk: destinationDesk,
        stage: destinationStage,
    };

    return destination;
}

export function getCurrentDeskDestination(id?: string): ISendToDestination {
    const destinationDeskId: string = sdApi.desks.getCurrentDeskId();
    const itemDeskId: string = sdApi.desks.getAllDesks().get(id)._id;

    return {
        type: 'desk',
        desk: itemDeskId ?? destinationDeskId,
        stage: null,
    };
}
