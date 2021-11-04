import React from 'react';
import classNames from 'classnames';
import {ItemUrgency, TypeIcon} from './index';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import ng from 'core/services/ng';
import {previewItems} from 'apps/authoring/preview/fullPreviewMultiple';

interface IProps {
    item?: IArticle;
    selected?: boolean;
    canEdit?: boolean;
    customMonitoringWidget?: boolean;
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

    preview() {
        previewItems([this.item]);
    }

    select(e) {
        if (querySelectorParent(e.target, 'button', {self: true})) {
            return;
        }

        if (!this.item.gone) {
            this.props.select(this.item);
        }
    }

    edit() {
        if (!this.item.gone) {
            this.props.edit(this.item);
        }
    }

    render() {
        const {shortFormat} = ng.get('datetime');
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
                    <ItemUrgency urgency={this.item.urgency} language={this.item.language} />
                </div>
                <div className="content-item__text">
                    <span className="keywords">{this.item.slugline}</span>
                    <span id="title" className="headline">{this.item.headline}</span>
                </div>
                <div className="content-item__date">
                    <time>{shortFormat(this.item.versioncreated)}</time>
                </div>
                {this.props.canEdit && !this.item.gone ? (
                    <div className="content-item__action">
                        {this.item.type !== 'composite'
                            ? (
                                <button
                                    className="icn-btn"
                                    onClick={this.preview}
                                    title={gettext('Preview')}
                                >
                                    <i className="icon-external" />
                                </button>
                            )
                            : ''
                        }
                        { this.props.customMonitoringWidget ?
                            ''
                            : (
                                <button
                                    className="icn-btn"
                                    onClick={this.edit}
                                    title={gettext('Edit')}
                                >
                                    <i className="icon-pencil" />
                                </button>
                            )}
                    </div>
                )
                    :
                    ''
                }
            </li>
        );
    }
}
