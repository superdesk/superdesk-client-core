import React, {ElementType, CSSProperties, SyntheticEvent} from 'react';
import {createPortal} from 'react-dom';
import {positionPopup} from '../helpers';

interface IProps {
    label: string;
    close: () => void;
    target: ElementType | EventTarget;
}

const BACKDROP_STYLE: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999, // positionPopup sets it to 1000
    overflow: 'auto', // to allow scroll
};

export class ItemListPopup extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.close = this.close.bind(this);
    }

    componentDidMount() {
        positionPopup(this.props.target);
    }

    close(event: SyntheticEvent) {
        event.stopPropagation();
        this.props.close();
    }

    render() {
        return createPortal(
            <ul className="highlights-list-menu">
                <li>
                    <div className="dropdown__menu-label">{this.props.label}</div>
                    <button className="dropdown__menu-close" onClick={this.close}>
                        <i className="icon-close-small icon--white" />
                    </button>
                </li>
                <li>
                    {this.props.children}
                </li>
                {createPortal(
                    <div style={BACKDROP_STYLE} onClick={this.close} onScroll={this.close}>
                        <div style={{height: '101%'}} />
                    </div>,
                    document.getElementById('react-backdrop'),
                    'backdrop',
                )}
            </ul>,
            document.getElementById('react-placeholder'),
            'popup',
        );
    }
}
