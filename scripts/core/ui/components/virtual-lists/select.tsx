import React from 'react';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {showPopup} from '../popupNew';
import {IBaseRestApiResponse, IPropsSelectFromRemote, ISuperdeskQuery} from 'superdesk-api';
import {VirtualListFromQuery} from './virtual-list-from-query';
import {gettext} from 'core/utils';
import {InputLabel} from '../input-label';
import {SpacerBlock} from '../Spacer';
import {IconButton} from 'superdesk-ui-framework';

interface IState<T> {
    selected: 'loading' | T | null;
    searchString: string;
}

export class SelectFromEndpoint<T extends IBaseRestApiResponse>
    extends SuperdeskReactComponent<IPropsSelectFromRemote<T>, IState<T>> {
    private valueEl: HTMLDivElement;
    private lastPopup: {close: () => void} | null;
    constructor(props: IPropsSelectFromRemote<T>) {
        super(props);

        this.state = {
            selected: null,
            searchString: '',
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

    componentDidUpdate() {
        if (this.props.value == null && this.state.selected != null) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({selected: null});
        }
    }

    render() {
        if (this.state.selected === 'loading') {
            return null;
        }

        const Template = this.props.itemTemplate;

        return (
            <div
                style={{width: this.props.noGrow === true ? undefined : '100%'}}
            >
                {
                    this.props.label != null && (
                        <div>
                            <InputLabel
                                text={this.props.label}
                                errorStyle={this.props.validationError != null}
                            />

                            <SpacerBlock v gap="4" />
                        </div>
                    )
                }

                <div
                    ref={(el) => {
                        this.valueEl = el;
                    }}
                    onClick={() => {
                        if (this.lastPopup != null) {
                            this.lastPopup.close();
                            this.lastPopup = null;

                            return;
                        }

                        if (this.props.readOnly === true) {
                            return;
                        }

                        this.lastPopup = showPopup(
                            this.valueEl,
                            'bottom-end',
                            ({closePopup}) => (
                                <div className="p-dropdown-panel" style={{position: 'static'}}>

                                    {/*

                                    TODO: Implement filtering;
                                    Find out how to add "regex-search on field" operator to `IComparisonOptions`

                                    <div className="p-dropdown-item" style={{background: 'none'}}>
                                        <Input
                                            type="text"
                                            value={this.state.searchString}
                                            onChange={(val) => {
                                                this.setState({searchString: val.trim()});
                                            }}
                                            inlineLabel
                                            labelHidden
                                        />
                                    </div>

                                    */}

                                    <VirtualListFromQuery<T, never>
                                        width={this.valueEl.offsetWidth}
                                        height={200}
                                        query={{
                                            endpoint: this.props.endpoint,
                                            // TODO: regex operator needed
                                            // filter: {$and: [{'field': {$eq: 'test'}}]},
                                            sort: this.props.sort.reduce<ISuperdeskQuery['sort']>(
                                                (acc, [fieldId, direction]) => acc.concat({[fieldId]: direction}), []),
                                        }}
                                        itemTemplate={({entity}) => (
                                            <span
                                                onClick={() => {
                                                    if (this.props.readOnly === true) {
                                                        return;
                                                    }

                                                    this.props.onChange(entity._id);

                                                    this.fetchEntity(entity._id);
                                                    closePopup();
                                                }}
                                                className="p-dropdown-item"
                                            >
                                                <Template entity={entity} />
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
                            undefined,
                            () => {
                                this.lastPopup = null;
                            },
                        );
                    }}
                    className="p-dropdown"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: this.props.noGrow === true ? undefined : '100%',
                        opacity: this.props.readOnly === true ? 0.6 : undefined,
                    }}
                >
                    <Template entity={this.state.selected} />
                    <span className="p-dropdown-trigger">
                        {
                            (this.props.required !== true && this.props.value !== null) && (
                                <IconButton
                                    icon="remove-sign"
                                    ariaValue={gettext('clear')}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        this.props.onChange(null);
                                    }}
                                />
                            )
                        }
                        <span className="p-dropdown-trigger-icon pi pi-chevron-down p-clickable " />
                    </span>
                </div>

                {
                    this.props.validationError != null && (
                        <div>
                            <SpacerBlock v gap="4" />
                            <span className="input-error">{this.props.validationError}</span>
                        </div>
                    )
                }
            </div>
        );
    }
}
