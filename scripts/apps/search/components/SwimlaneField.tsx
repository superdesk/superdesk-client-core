import React from 'react';
import * as fields from './fields';
import {IArticle} from 'superdesk-api';

interface IProps {
    svc: any;
    item: IArticle;
    fieldId: string;
}

export const SwimlaneField: React.StatelessComponent<IProps> = (props) => {
    const {item, fieldId} = props;

    const customRenderedAvailable = typeof fields[fieldId] === 'function';
    const value = customRenderedAvailable
        ? fields[fieldId]({item: item, svc: props.svc})
        : item[fieldId];

    if (value == null) {
        return null;
    }

    return value;
};
