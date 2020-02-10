import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ItemUrgency, TypeIcon} from './index';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';

interface IProps {
    item?: any;
    selected?: boolean;
    canEdit?: boolean;
    customMonitoringWidget?: boolean;
    svc: any;
    preview: (item: IArticle) => void;
    select: (item: IArticle) => void;
    edit: (item: IArticle) => void;
}

/**
 * @ngdoc React
 * @module superdesk.search
 * @name WidgetItemComponent
 * @description This component is a row in monitoring widget item list.
 */
export class WidgetItem extends React.Component<IProps, any> {
    item: any;

    constructor(props) {
        super(props);
        this.item = props.item;

        this.preview = this.preview.bind(this);
        this.select = this.select.bind(this);
        this.edit = this.edit.bind(this);
    }

    preview(event) {
        event.stopPropagation();
        this.props.preview(this.item);
    }

    select(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.item.gone) {
            this.props.select(this.item);
        }
    }

    edit(e) {
        e.stopPropagation();
        if (!this.item.gone) {
            this.props.edit(this.item);
        }
    }

    render() {
        const className = classNames(
            'content-item',
            {'content-item--locked': this.item.lock_user},
            {'custom-monitoring': this.props.customMonitoringWidget},
            {shifted: this.props.canEdit},
            {active: this.props.selected},
            {gone: !!this.item.gone},
        );

        return (
            <li onClick={this.select} onDoubleClick={this.edit} className={className}>
                <div className="content-item__type">
                    <TypeIcon
                        type={this.item.type}
                        highlight={this.item.highlight}
                    />
                </div>
                <div className="content-item__urgency-field">
                    <ItemUrgency svc={this.props.svc} item={this.item} />
                </div>
                <div className="content-item__text">
                    <span className="keywords">{this.item.slugline}</span>
                    <span id="title" className="headline">{this.item.headline}</span>
                </div>
                <div className="content-item__date">
                    <time>{this.props.svc.datetime.shortFormat(this.item.versioncreated)}</time>
                </div>
                { this.props.canEdit && !this.item.gone ?
                    <div className="content-item__action">
                        { this.item.type !== 'composite' ?
                            <button className="icn-btn" onMouseDown={this.preview}
                                title={gettext('Preview')}>
                                <i className="icon-external"/>
                            </button>
                            :
                            ''
                        }
                        { this.props.customMonitoringWidget ?
                            ''
                            :
                            <button className="icn-btn" onMouseDown={this.edit}
                                title={gettext('Edit')}>
                                <i className="icon-pencil"/>
                            </button>
                        }
                    </div>
                    :
                    ''
                }
            </li>
        );
    }
}
