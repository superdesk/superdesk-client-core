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
 * @description Creates dropdown react element with list of available desks
 */
import React from 'react';
import {MarkDesksDropdown} from 'apps/desks/components';

DesksReactDropdown.$inject = ['item', 'className', 'desks', 'noDesksLabel'];
export function DesksReactDropdown(item, className, desks, noDesksLabel) {
    return (
        <MarkDesksDropdown className={className} desks={desks} item={item} noDesksLabel={noDesksLabel}/>
    );
}