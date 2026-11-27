import {OrderedMap} from 'immutable';
import {IArticle, IArticleSideWidgetComponentType} from 'superdesk-api';
import {getWidgetAttachments, setWidgetAttachments} from './authoring-widget';

describe('attachments side widget', () => {
    it('uses fieldsData when the content profile has the attachments field', () => {
        const onFieldsDataChange = jasmine.createSpy('onFieldsDataChange');
        const onItemChange = jasmine.createSpy('onItemChange');
        const props = {
            article: {attachments: []} as IArticle,
            fieldsData: OrderedMap<string, unknown>([['attachments', [{id: 'a1'}]]]),
            onFieldsDataChange,
            onItemChange,
        } as unknown as IArticleSideWidgetComponentType;

        expect(getWidgetAttachments(props)).toEqual([{id: 'a1'}]);

        setWidgetAttachments(props, [{id: 'a1'}, {id: 'a2'}]);

        expect(onFieldsDataChange.calls.mostRecent().args[0].toJS()).toEqual({
            attachments: [{id: 'a1'}, {id: 'a2'}],
        });
        expect(onItemChange).not.toHaveBeenCalled();
    });

    it('stores on the article when the content profile has no attachments field', () => {
        const onFieldsDataChange = jasmine.createSpy('onFieldsDataChange');
        const onItemChange = jasmine.createSpy('onItemChange');
        const props = {
            article: {_id: 'item-1', attachments: [{attachment: 'a1'}]} as IArticle,
            fieldsData: OrderedMap<string, unknown>([['headline', 'test']]),
            onFieldsDataChange,
            onItemChange,
        } as unknown as IArticleSideWidgetComponentType;

        expect(getWidgetAttachments(props)).toEqual([{id: 'a1'}]);

        setWidgetAttachments(props, [{id: 'a1'}, {id: 'a2'}]);

        expect(onItemChange).toHaveBeenCalledWith(jasmine.objectContaining({
            _id: 'item-1',
            attachments: [{attachment: 'a1'}, {attachment: 'a2'}],
        }));
        expect(onFieldsDataChange).not.toHaveBeenCalled();
    });
});
