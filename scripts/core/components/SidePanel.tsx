/* eslint-disable react/no-multi-comp */

import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IPropsSidePanel {
    children: Array<React.ReactElement<SidePanelHeader> | React.ReactElement<SidePanelContent>>;
    side: 'left' | 'right';
    width: number; // required because due to a bad implementation of SidePanelTools, they go on top heading text
}

export class SidePanel extends React.Component<IPropsSidePanel, any> {
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
            <div className={classes.join(' ')} style={{width: this.props.width}}>
                {this.props.children}
            </div>
        );
    }
}

type OneOrMany < T > = React.ReactElement<T> | Array<React.ReactElement<T>>;

interface IPropsSidePanelHeader {
    children: OneOrMany<SidePanelHeading> | OneOrMany<SidePanelTools>;
}

export class SidePanelHeader extends React.Component<IPropsSidePanelHeader, any> {
    render() {
        return (
            <div className="side-panel__header">
                {this.props.children}
            </div>
        );
    }
}

interface IPropsSidePanelContent {
    children: React.ReactElement<SidePanelContentBlock> | Array<React.ReactElement<SidePanelContentBlock>>;
}

export class SidePanelContent extends React.Component<IPropsSidePanelContent> {
    render() {
        return (
            <div className="side-panel__content">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelContentBlock extends React.Component<any, any> {
    render() {
        return (
            <div className="side-panel__content-block">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelHeading extends React.Component<IPropsSidePanelHeader, any> {
    render() {
        return (
            <div className="side-panel__heading">
                {this.props.children}
            </div>
        );
    }
}

export class SidePanelTools extends React.Component<any, any> {
    render() {
        return (
            <div className="side-panel__tools">
                {this.props.children}
            </div>
        );
    }
}
