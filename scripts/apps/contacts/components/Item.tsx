import React from 'react';
import classNames from 'classnames';
import {
    ListItemInfo,
    ListTypeIcon,
    ContactInfo,
    ContactFooter,
} from 'apps/contacts/components';
import {Spacer} from 'superdesk-ui-framework/react';
import {IContact} from 'superdesk-api';

interface IProps {
    svc: Record<string, any>;
    scope: Record<string, any>;
    item: IContact;
    flags: Record<string, any>;
    view: string;
    onSelect: (item: any, event: React.MouseEvent<HTMLLIElement>) => void;
}

interface IState {
    hover: boolean;
}

export class Item extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    svc: any;

    constructor(props) {
        super(props);

        this.state = {hover: false};
        this.select = this.select.bind(this);
        this.setHoverState = this.setHoverState.bind(this);
        this.unsetHoverState = this.unsetHoverState.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.item !== this.props.item ||
            nextProps.view !== this.props.view ||
            nextProps.flags.selected !== this.props.flags.selected ||
            nextState !== this.state;
    }

    select(event) {
        this.props.onSelect(this.props.item, event);
    }

    setHoverState() {
        this.setState({hover: true});
    }

    unsetHoverState() {
        this.setState({hover: false});
    }

    render() {
        const {item, svc, flags, view, scope} = this.props;

        return (
            <li
                id={item._id}
                key={item._id}
                className={classNames(
                    'list-item-view',
                    {
                        active: flags.selected,
                        inactive: !item.is_active,
                    },
                )}
                onMouseEnter={this.setHoverState}
                onMouseLeave={this.unsetHoverState}
                onClick={this.select}
            >
                <div
                    className={classNames(
                        this.props.view === 'photogrid'
                            ? 'sd-grid-item sd-grid-item--with-click'
                            : 'media-box contacts',
                        {
                            selected: flags.selected,
                        },
                    )}
                >
                    {view === 'photogrid' ? (
                        <Spacer gap="0" v justifyContent="start" alignItems="center">
                            <ContactInfo item={item} />
                            <ContactFooter item={item} />
                        </Spacer>
                    ) : (
                        <Spacer gap="4" v justifyContent="start" alignItems="center">
                            <ListTypeIcon item={item} svc={svc} />
                            <ListItemInfo item={item} svc={svc} scope={scope} />
                        </Spacer>
                    )}
                </div>
            </li>
        );
    }
}
