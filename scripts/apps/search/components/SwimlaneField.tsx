import React from 'react';
import {fields} from './fields';
import {IArticle} from 'superdesk-api';

interface IProps {
    svc: any;
    item: IArticle;
    fieldId: string;
}

export const SwimlaneField: React.StatelessComponent<IProps> = (props) => {
    const {item, fieldId} = props;

    const Component = fields[fieldId];
    const value = Component != null
        ? <Component item={item} svc={props.svc} />
        : item[fieldId];

    if (value == null) {
        return null;
    }

    return value;
};
