import React from 'react';
import {IPropsIconBig} from 'superdesk-api';

export class IconBig extends React.PureComponent<IPropsIconBig> {
    render() {
        return (
            <i className={`big-icon--${this.props.name} icon-big--inherit-color`} />
        );
    }
}
