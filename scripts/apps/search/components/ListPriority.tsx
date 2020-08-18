import React from 'react';
import classNames from 'classnames';
import {renderArea} from '../helpers';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    singleLine: any;
}

export class ListPriority extends React.PureComponent<IProps> {
    render() {
        const css = {
            className: classNames('list-field urgency', {
                'urgency-reduced-rowheight': this.props.singleLine,
            }),
        };

        return renderArea('priority', this.props, css) || React.createElement('div', css);
    }
}
