import React from 'react';
import {TimeElem} from '../index';

interface IProps {
    item: any;
    svc: {
        datetime: any;
    };
}

export const versioncreated: React.StatelessComponent<IProps> = (props) => (
    <TimeElem key={versioncreated} date={props.item.versioncreated} svc={props.svc} />
);
