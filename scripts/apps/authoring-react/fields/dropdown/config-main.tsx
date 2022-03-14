import * as React from 'react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfig, IDropdownDataCustom, IDropdownDataVocabulary} from '.';
import {TabList} from 'core/ui/components/tabs';
import {ConfigManualEntry} from './config-manual-entry';
import {ConfigFromVocabulary} from './config-use-vocabulary';
import {SpacerInline} from 'core/ui/components/Spacer';

type IProps = IConfigComponentProps<IDropdownConfig>;

interface IState {
    source: IDropdownConfig['source'];
}

export class Config extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            source: props.config?.source ?? 'manual-entry',
        };
    }

    render() {
        const sourceManualEntry: IDropdownConfig['source'] = 'manual-entry';
        const sourceVocabulary: IDropdownConfig['source'] = 'vocabulary';

        const {source} = this.state;

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
                    if (source === 'manual-entry') {
                        const defaults: IDropdownDataCustom = {
                            source: 'manual-entry',
                            type: 'text',
                            options: [],
                            roundCorners: false,
                        };

                        const currentConfig: IDropdownDataCustom = this.props.config?.source === 'manual-entry'
                            ? this.props.config // has value set already
                            : defaults;

                        return (
                            <ConfigManualEntry
                                config={currentConfig}
                                onChange={(config) => this.props.onChange(config)}
                            />
                        );
                    } else if (source === 'vocabulary') {
                        const defaults: IDropdownDataVocabulary = {
                            source: 'vocabulary',
                            vocabularyId: null,
                        };

                        const currentConfig: IDropdownDataVocabulary = this.props.config?.source === 'vocabulary'
                            ? this.props.config // has value set already
                            : defaults;

                        return (
                            <ConfigFromVocabulary
                                config={currentConfig}
                                onChange={(config) => this.props.onChange(config)}
                            />
                        );
                    }
                })()}
            </div>
        );
    }
}
