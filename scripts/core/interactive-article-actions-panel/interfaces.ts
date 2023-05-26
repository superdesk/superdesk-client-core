import {IDesk, IStage, IArticle} from 'superdesk-api';

export type IArticleActionInteractive = 'send_to' | 'fetch_to' | 'unspike' | 'duplicate_to' | 'publish' | 'correct';

export interface IPanelAction {
    items: Array<IArticle>;
    tabs: Array<IArticleActionInteractive>;
    activeTab: IArticleActionInteractive;
    onError?: (error: IPublishingError) => void;
}

export interface IPublishingError {
    kind: 'publishing-error';
    fields: {
        [fieldId: string]: string;
    };
}

export type IPanelError = IPublishingError;

export interface ISendToDestinationDesk {
    type: 'desk';
    desk: IDesk['_id'];
    stage: IStage['_id'];
}

export interface ISendToDestinationPersonalSpace {
    type: 'personal-space';
}

export type ISendToDestination = ISendToDestinationDesk | ISendToDestinationPersonalSpace;
