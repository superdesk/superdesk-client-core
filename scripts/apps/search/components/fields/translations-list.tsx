import React from 'react';
import {IArticle} from 'superdesk-api';

interface IProps {
    svc: any;
    ids: Array<IArticle['_id']>;
    label: string;
    onClose: () => void;
    onClick: (item: IArticle) => void;
}

interface IState {
    items: Array<IArticle>;
}

export class TranslationsList extends React.PureComponent<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {items: []};
    }

    componentDidMount() {
        const {api} = this.props.svc;

        Promise.all(this.props.ids.map((id) => api.find('archive', id)))
            .then((items) => {
                this.setState({items});
            });
    }

    render() {
        return (
            <ul className="highlights-list-menu open">
                <li>
                    <div className="dropdown__menu-label">{this.props.label}</div>
                    <button className="dropdown__menu-close" onClick={() => this.props.onClose()}>
                        <i className="icon-close-small icon--white" />
                    </button>
                </li>
                {this.state.items.length === 0 && (
                    <li style={{minHeight: this.props.ids.length * 1.5 + 'em'}}>
                        <div className="sd-loader sd-loader--dark-ui" />
                    </li>
                )}
                {this.state.items.map((item) => (
                    <li key={item._id}>
                        <b className="label label--hollow">{item.language}</b>
                        &nbsp;
                        <a className="sd-overflow-ellipsis"
                            onClick={() => this.props.onClick(item)}>
                            {item.headline || item.slugline}
                        </a>
                    </li>
                ))}
            </ul>
        );
    }
}
