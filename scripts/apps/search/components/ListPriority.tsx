import React from 'react';
import classNames from 'classnames';
import {renderArea} from '../helpers';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    svc: {};
    scope: {
        singleLine: boolean;
    };
}

export class ListPriority extends React.PureComponent<IProps> {
    render() {
        const css = {
            className: classNames('list-field urgency', {
                'urgency-reduced-rowheight': this.props.scope.singleLine,
            }),
        };

        return renderArea('priority', this.props, css) || React.createElement('div', css);
    }
}
