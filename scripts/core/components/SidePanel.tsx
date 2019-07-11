/* eslint-disable react/no-multi-comp, react/prop-types */

import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IPropsSidePanel {
    side: 'left' | 'right';
    width: number; // required because due to a bad implementation of SidePanelTools, they go on top heading text
    'data-test-id'?: string;
}

export class SidePanel extends React.Component<IPropsSidePanel> {
    render() {
        let classes = ['side-panel'];

        if (this.props.side === 'right') {
            classes.push('side-panel--shadow-right');
        } else if (this.props.side === 'left') {
            classes.push('side-panel--shadow-left');
        } else {
            assertNever(this.props.side);
        }

        return (
            <div
                className={classes.join(' ')}
                style={{width: this.props.width}}
                data-test-id={this.props['data-test-id']}
            >
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelHeader extends React.Component {
    render() {
        return (
            <div className="side-panel__header">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelContent extends React.Component {
    render() {
        return (
            <div className="side-panel__content">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelContentBlock extends React.Component {
    render() {
        return (
            <div className="side-panel__content-block">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelHeading extends React.Component {
    render() {
        return (
            <div className="side-panel__heading">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelTools extends React.Component {
    render() {
        return (
            <div className="side-panel__tools">
                {this.props.children}
            </div>
        );
    }
}
