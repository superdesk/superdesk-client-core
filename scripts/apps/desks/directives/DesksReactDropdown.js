/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name DesksReactDropdown
 *
 * @requires React
 * @requires item
 * @requires className
 * @requires desks
 * @requires noDesksLabel
 *
 * @param {Object} [desks] collection of desks
 *
 * @description Creates dropdown react element with list of available desks
 */

import React from 'react';

DesksReactDropdown.$inject = ['item', 'className', 'desks', 'gettext', 'noDesksLabel'];
export function DesksReactDropdown(item, className, desks, gettext, noDesksLabel) {
    var MarkBtn = React.createClass({
        markDesk: function(event) {
            event.stopPropagation();
            desks.markItem(this.props.desk._id, this.props.item);
        },
        render: function() {
            var item = this.props.item;
            var desk = this.props.desk;
            var isMarked = item.marked_desks && _.findIndex(item.marked_desks, (md) => {
                md.desk_id === desk._id;
            }) >= 0;

            return React.createElement(
                'button',
                {disabled: isMarked, onClick: this.markDesk},
                React.createElement('i', {className: 'icon-bell'}),
                desk.name
            );
        }
    });

    var createMarkedDeskItem = function(desk) {
        return React.createElement(
            'li',
            {key: 'desk-' + desk._id},
            React.createElement(MarkBtn, {item: item, desk: desk})
        );
    };

    var noMarkedDesks = function() {
        return React.createElement(
            'li',
            {},
            React.createElement(
                'button',
                {disabled: true},
                noDesksLabel)
        );
    };

    return React.createElement(
        'ul',
        {className: className},
        desks.desks._items.length ? desks.desks._items.map(createMarkedDeskItem) : React.createElement(noMarkedDesks)
    );
}