import React from 'react';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {showPopup} from '../popupNew';
import {IBaseRestApiResponse, IPropsSelectFromRemote, ISuperdeskQuery} from 'superdesk-api';
import {VirtualListFromQuery} from './virtual-list-from-query';
import {gettext} from 'core/utils';

interface IState<T> {
    selected: 'loading' | T | null;
}

/**
 * TODO: finish
 */
export class SelectFromEndpoint<T extends IBaseRestApiResponse>
    extends SuperdeskReactComponent<IPropsSelectFromRemote<T>, IState<T>> {
    private valueEl: HTMLDivElement;
    constructor(props: IPropsSelectFromRemote<T>) {
        super(props);

        this.state = {
            selected: null,
        };

        this.fetchEntity = this.fetchEntity.bind(this);
    }

    fetchEntity(id: string | null) {
        if (id != null) {
            this.asyncHelpers.httpRequestJsonLocal<T>({
                method: 'GET',
                path: `${this.props.endpoint}/${id}`,
            }).then((val) => {
                this.setState({selected: val});
            });
        } else {
            this.setState({selected: null});
        }
    }

    componentDidMount() {
        this.fetchEntity(this.props.value ?? null);
    }

    render() {
        if (this.state.selected === 'loading') {
            return null;
        }

        const Template = this.props.itemTemplate;

        return (
            <div
                ref={(el) => {
                    this.valueEl = el;
                }}
                onClick={(event) => {
                    showPopup(
                        event.target as HTMLElement,
                        'bottom-end',
                        ({closePopup}) => (
                            <div className="p-dropdown-panel" style={{position: 'static'}}>
                                <VirtualListFromQuery
                                    width={this.valueEl.offsetWidth}
                                    height={200}
                                    query={{
                                        endpoint: this.props.endpoint,
                                        sort: this.props.sort.reduce<ISuperdeskQuery['sort']>(
                                            (acc, [fieldId, direction]) => acc.concat({[fieldId]: direction}), []),
                                    }}
                                    itemTemplate={({item}: {item: T}) => (
                                        <span
                                            onClick={() => {
                                                this.props.onChange(item._id);

                                                this.fetchEntity(item._id);
                                                closePopup();
                                            }}
                                        >
                                            <Template item={item} />
                                        </span>
                                    )}
                                    noItemsTemplate={
                                        () => (
                                            <div>
                                                {gettext('No items yet')}
                                            </div>
                                        )
                                    }
                                />
                            </div>
                        ),
                        3000,
                    );
                }}
                className="p-dropdown"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: this.props.noGrow === true ? undefined : '100%',
                }}
            >
                <Template item={this.state.selected} />
                <span className="p-dropdown-trigger">
                    <span className="p-dropdown-trigger-icon pi pi-chevron-down p-clickable" />
                </span>
            </div>
        );
    }
}
