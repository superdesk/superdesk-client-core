import React from 'react';
import {IconButton, Input, WithPagination} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from '../Spacer';
import {
    ITemplate,
} from 'superdesk-api';
import {DropdownOption} from './dropdown-option';
import {sdApi} from 'api';

interface IProps {
    onSelect(template: ITemplate): void;
    back(): void;
}

interface IState {
    searchString: string;
}

export class MoreTemplates extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            searchString: '',
        };
    }

    render() {
        return (
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    paddingBlockEnd: 10,
                }}
            >
                <div style={{padding: 10}}>
                    <Spacer h gap="4" justifyContent="start" alignItems="center" noGrow>
                        <IconButton
                            ariaValue={gettext('Back')}
                            icon="chevron-left-thin"
                            onClick={() => {
                                this.props.back();
                            }}
                        />
                        <span className="form-label" style={{minHeight: 0}}>{gettext('More templates')}</span>
                    </Spacer>
                    <SpacerBlock v gap="4" />
                    <Input
                        inlineLabel
                        labelHidden
                        type="text"
                        label=""
                        value={this.state.searchString}
                        onChange={(val) => {
                            this.setState({searchString: val});
                        }}
                        data-test-id="search"
                    />
                    <div className="content-create-dropdown--spacer" />
                </div>

                <div style={{height: '100%', overflow: 'auto'}}>
                    <WithPagination
                        key={this.state.searchString}
                        getItems={(pageNo, pageSize, signal) =>
                            sdApi.templates.getUserTemplates(
                                pageNo,
                                pageSize,
                                'create',
                                this.state.searchString,
                                signal,
                            )
                                .then((res) => ({items: res._items, itemCount: res._meta.total}))
                        }
                    >
                        {
                            (items: Array<ITemplate>) => (
                                <Spacer v alignItems="center" gap="8">
                                    {
                                        items.map((item) => {
                                            return (
                                                <DropdownOption
                                                    key={item._id}
                                                    label={item.template_name}
                                                    privateTag={item.is_public !== true}
                                                    icon={{
                                                        name: 'plus-sign',
                                                        color: 'var(--sd-colour-primary)',
                                                    }}
                                                    onClick={() => {
                                                        this.props.onSelect(item);
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Spacer>
                            )
                        }
                    </WithPagination>
                </div>
            </div>
        );
    }
}
