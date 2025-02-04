import React from 'react';

import {Settings} from './settings';

interface IProps {
    title: string;
    children: React.ReactNode;
}

export class SettingsPage extends React.PureComponent<IProps> {
    render() {
        return (
            <Settings>
                <div className="sd-page__header sd-page__header--white">
                    <h2 className="sd-page__page-heading">{this.props.title}</h2>
                </div>
                <div className="sd-page__flex-helper">
                    {this.props.children}
                </div>
            </Settings>
        );
    }
}
