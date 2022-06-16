import {IIngestRuleHandler, IRestApiResponse, IIngestRule, IIngestRuleHandlerExtension} from 'superdesk-api';
import {extensions} from 'appConfig';
import {dataApi} from 'core/helpers/CrudManager';

let _ruleHandlers: {[key: string]: IIngestRuleHandler};

function getRuleHandlers(): Promise<{[key: string]: IIngestRuleHandler}> {
    if (_ruleHandlers != null) {
        return Promise.resolve(_ruleHandlers);
    }

    return dataApi.queryRawJson<IRestApiResponse<IIngestRuleHandler>>('ingest_rule_handlers').then((response) => {
        return response._items.reduce((handlers, handler) => {
            handlers[handler._id] = handler;

            return handlers;
        }, {});
    })
        .then((handlers) => {
            _ruleHandlers = handlers;

            return _ruleHandlers;
        });
}

function getHandlerForIngestRule(rule: IIngestRule): IIngestRuleHandler {
    return _ruleHandlers[rule.handler || 'desk_fetch_publish'];
}

function getExtensionForIngestRuleHandler(rule: IIngestRule): IIngestRuleHandlerExtension | undefined {
    const handlerName = rule.handler || 'desk_fetch_publish';

    return Object
        .values(extensions)
        .find(({activationResult}) => (
            activationResult.contributions?.entities?.ingest?.ruleHandlers[handlerName] != null
        ))
        ?.activationResult?.contributions?.entities?.ingest?.ruleHandlers[handlerName];
}

interface IIngestApi {
    getRuleHandlers(): Promise<{[key: string]: IIngestRuleHandler}>;
    getHandlerForIngestRule(rule: IIngestRule): IIngestRuleHandler;
    getExtensionForIngestRuleHandler(rule: IIngestRule): IIngestRuleHandlerExtension | undefined;
}

export const ingest: IIngestApi = {
    getRuleHandlers,
    getHandlerForIngestRule,
    getExtensionForIngestRuleHandler,
};
