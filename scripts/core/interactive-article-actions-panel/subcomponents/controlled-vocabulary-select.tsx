import React from 'react';
import {Button, Tag} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {SelectFilterable} from 'core/ui/components/select-filterable';

interface IValue {
    qcode: string;
    name: string;
    allow: boolean;
}

interface IProps {
    required?: boolean;
    vocabularies: Array<{qcode: string; name: string}>;
    value: Array<IValue>;
    onChange(value: Array<IValue>): void;
}

interface IState {
    vocabulary: {
        qcode: string;
        name: string;
    } | null;
    allow: boolean;
}

export class ControlledVocabulariesSelect extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            vocabulary: null,
            allow: true,
        };
    }

    render() {
        const selectedIds = new Set(this.props.value.map(({qcode}) => qcode));
        const itemsExcludingSelected = this.props.vocabularies.filter(({qcode}) => selectedIds.has(qcode) !== true);

        return (
            <div>
                <Spacer h gap="8" justifyContent="space-between" alignItems="center" noWrap>
                    <Button
                        text={gettext('Not')}
                        onClick={() => {
                            this.setState({
                                allow: !this.state.allow,
                            });
                        }}
                        style={this.state.allow ? 'hollow' : 'filled'}
                        type={this.state.allow ? 'default' : 'primary'}
                    />
                    <SelectFilterable
                        items={itemsExcludingSelected}
                        value={this.state.vocabulary}
                        getLabel={(vocabulary) => vocabulary?.name ?? ''}
                        onChange={(val) => {
                            this.setState({vocabulary: val});
                        }}
                        required={this.props.required}
                    />
                    <Button
                        text={gettext('Add')}
                        onClick={() => {
                            const vocabulary = this.state.vocabulary;

                            this.props.onChange([
                                ...this.props.value,
                                {
                                    name: vocabulary.name,
                                    qcode: vocabulary.qcode,
                                    allow: this.state.allow,
                                },
                            ]);

                            this.setState({
                                vocabulary: null,
                            });
                        }}
                        disabled={this.state.vocabulary == null}
                        style="hollow"
                        type="primary"
                    />
                </Spacer>
                {
                    this.props.value.length > 0 && (
                        <div style={{paddingTop: 5}}>
                            {
                                this.props.value
                                    .map((region) => (
                                        <Tag
                                            key={region.qcode}
                                            text={`${region.allow ? '' : gettext('not')} ${region.name}`}
                                            onClick={() => {
                                                this.props.onChange(this.props.value.filter(
                                                    ({qcode}) => region.qcode !== qcode,
                                                ));
                                            }}
                                        />
                                    ))
                            }
                        </div>
                    )
                }
            </div>
        );
    }
}
