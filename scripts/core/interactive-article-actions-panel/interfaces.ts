import {IDesk, IStage, IArticle} from 'superdesk-api';

export type IArticleActionInteractive = 'send_to' | 'fetch_to' | 'unspike' | 'duplicate_to' | 'publish' | 'correct';

export interface IPanelAction {
    items: Array<IArticle>;
    tabs: Array<IArticleActionInteractive>;
    activeTab: IArticleActionInteractive;
}

export interface ISendToDestinationDesk {
    type: 'desk';
    desk: IDesk['_id'];
    stage: IStage['_id'];
}

export interface ISendToDestinationPersonalSpace {
    type: 'personal-space';
}

export type ISendToDestination = ISendToDestinationDesk | ISendToDestinationPersonalSpace;
