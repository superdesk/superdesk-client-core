import * as React from 'react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfig, IDropdownDataCustom, IDropdownDataVocabulary, IDropdownValue} from '.';
import {TabList} from 'core/ui/components/tabs';
import {ConfigManualEntry} from './config-manual-entry';
import {ConfigFromVocabulary} from './config-use-vocabulary';
import {SpacerInline} from 'core/ui/components/Spacer';
import {Checkbox} from 'superdesk-ui-framework/react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Dropdown} from './dropdown';

type IProps = IConfigComponentProps<IDropdownConfig>;

interface IState {
    source: IDropdownConfig['source'];
    previewValue: IDropdownValue | null;
}

export class Config extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            source: props.config?.source ?? 'manual-entry',
            previewValue: undefined,
        };
    }

    render() {
        const sourceManualEntry: IDropdownConfig['source'] = 'manual-entry';
        const sourceVocabulary: IDropdownConfig['source'] = 'vocabulary';

        const config = (() => {
            if (this.state.source === 'manual-entry') {
                const defaults: IDropdownDataCustom = {
                    source: 'manual-entry',
                    type: 'text',
                    options: [],
                    roundCorners: false,
                    multiple: false,
                };

                const currentConfig: IDropdownDataCustom = this.props.config?.source === 'manual-entry'
                    ? this.props.config // has value set already
                    : defaults;

                return currentConfig;
            } else if (this.state.source === 'vocabulary') {
                const defaults: IDropdownDataVocabulary = {
                    source: 'vocabulary',
                    vocabularyId: null,
                    multiple: false,
                };

                const currentConfig: IDropdownDataVocabulary = this.props.config?.source === 'vocabulary'
                    ? this.props.config // has value set already
                    : defaults;

                return currentConfig;
            } else {
                assertNever(this.state.source);
            }
        })();

        return (
            <div>
                <TabList
                    tabs={[
                        {
                            id: sourceManualEntry,
                            label: gettext('Manual entry'),
                        },
                        {
                            id: sourceVocabulary,
                            label: gettext('Vocabulary'),
                        },
                    ]}
                    selected={this.state.source}
                    onChange={(val: IDropdownConfig['source']) => {
                        this.setState({source: val});
                    }}
                />

                <SpacerInline v gap="16" />

                {(() => {
                    if (config.source === 'manual-entry') {
                        return (
                            <ConfigManualEntry
                                config={config}
                                onChange={(_config) => this.props.onChange(_config)}
                            />
                        );
                    } else if (config.source === 'vocabulary') {
                        return (
                            <ConfigFromVocabulary
                                config={config}
                                onChange={(_config) => this.props.onChange(_config)}
                            />
                        );
                    } else {
                        assertNever(config);
                    }
                })()}

                <SpacerInline v gap="16" />

                {
                    <div>
                        <Checkbox
                            label={{text: gettext('Allow selecting multiple values')}}
                            checked={config.multiple}
                            onChange={(val: IDropdownConfig['multiple']) => {
                                this.props.onChange({
                                    ...config,
                                    multiple: val,
                                });
                            }}
                        />
                    </div>
                }

                <SpacerInline v gap="16" />

                {(() => {
                    if (config.source === 'manual-entry') {
                        return (
                            <div>
                                <label className="form-label">{gettext('Configuration preview')}</label>

                                <Dropdown
                                    config={config}
                                    value={this.state.previewValue}
                                    onChange={(val) => {
                                        this.setState({previewValue: val});
                                    }}
                                />
                            </div>
                        );
                    } else if (config.source === 'vocabulary') {
                        if (config.vocabularyId == null) {
                            return null;
                        }

                        return (
                            <div>
                                <label className="form-label">{gettext('Configuration preview')}</label>

                                <Dropdown
                                    config={config}
                                    value={this.state.previewValue}
                                    onChange={(val) => {
                                        this.setState({previewValue: val});
                                    }}
                                />
                            </div>
                        );
                    } else {
                        assertNever(config);
                    }
                })()}
            </div>
        );
    }
}
