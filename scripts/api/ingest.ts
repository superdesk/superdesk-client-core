import {flatMap} from 'lodash';
import {IIngestRuleHandler, IExtensionActivationResult} from 'superdesk-api';
import {extensions} from 'appConfig';
import {gettext} from 'core/utils';

const DEFAULT_HANDLER: IIngestRuleHandler = {
    name: 'desk_fetch_publish',
    label: gettext('Desks'),
    supportedActions: {
        fetch_to_desk: true,
        publish_from_desk: true,
    },
    supportedConfigs: {
        exit: true,
        preserveDesk: true,
    },
    getDefaults: function() {
        return {
            name: '',
            handler: 'desk_fetch_publish',
            filter: null,
            actions: {
                fetch: [],
                publish: [],
                exit: false,
            },
            schedule: {
                day_of_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
                hour_of_day_from: null,
                hour_of_day_to: null,
                _allDay: true,
            },
        };
    },
};

function getIngestRuleHandlers() {
    const getRuleHandlers
        : Array<IExtensionActivationResult['contributions']['entities']['ingest']['getRuleHandlers']>
        = [() => [DEFAULT_HANDLER]].concat(flatMap(
            Object.values(extensions).map(({activationResult}) => (
                activationResult.contributions?.entities?.ingest?.getRuleHandlers ?? []
            )),
        ));

    return flatMap(
        getRuleHandlers.map((getHandlers) => getHandlers()),
    ).reduce((handlers, handler) => {
        handlers[handler.name] = handler;

        return handlers;
    }, {});
}

interface IIngestApi {
    getIngestRuleHandlers(): {[key: string]: IIngestRuleHandler};
}

export const ingest: IIngestApi = {
    getIngestRuleHandlers,
};
