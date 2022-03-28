import * as React from 'react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfig, IDropdownConfigManualSource, IDropdownConfigVocabulary, IDropdownValue} from '.';
import {TabList} from 'core/ui/components/tabs';
import {ConfigManualEntry} from './dropdown-manual-entry/config';
import {ConfigFromVocabulary} from './dropdown-vocabulary/config';
import {SpacerInline} from 'core/ui/components/Spacer';
import {Checkbox} from 'superdesk-ui-framework/react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {EditorManualEntry} from './dropdown-manual-entry/editor';
import {getUserInterfaceLanguage} from 'appConfig';
import {EditorVocabulary} from './dropdown-vocabulary/editor';

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
                const defaults: IDropdownConfigManualSource = {
                    source: 'manual-entry',
                    type: 'text',
                    options: [],
                    roundCorners: false,
                    multiple: false,
                };

                const currentConfig: IDropdownConfigManualSource = this.props.config?.source === 'manual-entry'
                    ? this.props.config // has value set already
                    : defaults;

                return currentConfig;
            } else if (this.state.source === 'vocabulary') {
                const defaults: IDropdownConfigVocabulary = {
                    source: 'vocabulary',
                    vocabularyId: null,
                    multiple: false,
                };

                const currentConfig: IDropdownConfigVocabulary = this.props.config?.source === 'vocabulary'
                    ? this.props.config // has value set already
                    : defaults;

                return currentConfig;
            } else if (this.state.source === 'remote-source') {
                // dropdowns based on a remote source are not configurable via UI
                return null;
            } else if (this.state.source === 'dropdown-tree') {
                // tree dropdowns are not configurable via UI
                return null;
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

                                <EditorManualEntry
                                    config={config}
                                    value={this.state.previewValue}
                                    onChange={(val) => {
                                        this.setState({previewValue: val});
                                    }}
                                    language={getUserInterfaceLanguage()}
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

                                <EditorVocabulary
                                    config={config}
                                    value={this.state.previewValue}
                                    onChange={(val) => {
                                        this.setState({previewValue: val});
                                    }}
                                    language={getUserInterfaceLanguage()}
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
