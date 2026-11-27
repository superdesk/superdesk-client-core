import React from 'react';
import {shallow} from 'enzyme';
import {IArticle, IArticleSideWidgetComponentType} from 'superdesk-api';
import {VersionsTab} from '../versions-tab';
import {HistoryTab} from '../history-tab';

function getProps(article: Partial<IArticle>): IArticleSideWidgetComponentType {
    return {article: article as IArticle} as unknown as IArticleSideWidgetComponentType;
}

describe('authoring-react versions and history tabs', () => {
    it('reloads the versions when a save creates a new version', () => {
        const initialize = spyOn(VersionsTab.prototype, 'initialize');
        const wrapper = shallow(<VersionsTab {...getProps({_id: 'item-1', _current_version: 2})} />);

        expect(initialize).toHaveBeenCalledTimes(1);

        wrapper.setProps({article: {_id: 'item-1', _current_version: 2, headline: 'unsaved edit'}});
        expect(initialize).toHaveBeenCalledTimes(1);

        wrapper.setProps({article: {_id: 'item-1', _current_version: 3}});
        expect(initialize).toHaveBeenCalledTimes(2);
    });

    it('reloads the history when a save creates a new version', () => {
        const load = spyOn(HistoryTab.prototype as any, 'load');
        const wrapper = shallow(<HistoryTab {...getProps({_id: 'item-1', _current_version: 2})} />);

        expect(load).toHaveBeenCalledTimes(1);

        wrapper.setProps({article: {_id: 'item-1', _current_version: 3}});
        expect(load).toHaveBeenCalledTimes(2);
    });
});
