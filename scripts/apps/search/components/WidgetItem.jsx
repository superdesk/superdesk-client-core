import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {ItemUrgency, TypeIcon} from './index';


/**
 * @ngdoc React
 * @module superdesk.search
 * @name WidgetItemComponent
 * @param {Object} item The current item.
 * @param {Boolean} selected The item is selected.
 * @param {Boolean} allowed The edit of item is allowed.
 * @param {Boolean} customMonitoringWidget The custom flag from config file
 * @param {Object} svc The superdesk services
 * @param {Function} preview The callback function on item preview
 * @param {Function} select The callback function on item selection
 * @param {Function} edit The callback function on item edit
 * @description This component is a row in monitoring widget item list.
 */
export class WidgetItem extends React.Component {
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
        let className = classNames(
            'content-item',
            {'content-item--locked': this.item.lock_user},
            {'custom-monitoring': this.props.customMonitoringWidget},
            {shifted: this.props.allowed},
            {active: this.props.selected},
            {gone: !!this.item.gone}
        );

        return (
            <li onClick={this.select} onDoubleClick={this.edit} className={className}>
                <div className="content-item__type">
                    <TypeIcon
                        type={this.item.type}
                        highlight={this.item.highlight}
                        svc={this.props.svc}
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
                { this.props.allowed && !this.item.gone ?
                    <div className="content-item__action">
                        <button onMouseDown={this.preview} title={this.props.svc.gettextCatalog.getString('Preview')}>
                            <i className="icon-external"/>
                        </button>
                        { this.props.customMonitoringWidget ?
                            ''
                            :
                            <button onMouseDown={this.edit} title={this.props.svc.gettextCatalog.getString('Edit')}>
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

WidgetItem.propTypes = {
    item: PropTypes.object,
    selected: PropTypes.bool,
    allowed: PropTypes.bool,
    customMonitoringWidget: PropTypes.bool,
    svc: PropTypes.object.isRequired,
    preview: PropTypes.func.isRequired,
    select: PropTypes.func.isRequired,
    edit: PropTypes.func.isRequired,
};
