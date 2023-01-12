import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IBaseRestApiResponse} from 'superdesk-api';
import {Heading, Label, Select, Option} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';

interface IProps {
    versions: Array<(IArticle & IBaseRestApiResponse)>;
    currentVersion: (IArticle & IBaseRestApiResponse);
    onChange(value: number): void;
    displayVersion: string;
}

export class VersionOptions extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        const {
            currentVersion,
            onChange,
            versions,
            displayVersion,
        } = this.props;

        return (
            <Spacer h gap="8" justifyContent="space-between" alignItems="center" noGrow style={{width: '100%'}}>
                <div style={{width: 100}}>
                    <Select
                        value={displayVersion}
                        label={gettext('Select version')}
                        onChange={(value) => onChange(Number(value))}
                    >
                        {
                            versions.map((ver, i) => {
                                return (
                                    <Option value={i.toString()} key={i}>{ver._current_version}</Option>
                                );
                            })
                        }
                    </Select>
                </div>
                <Spacer v gap="4" justifyContent="center" noGrow>
                    <Spacer h gap="4" noGrow justifyContent="start">
                        <Heading type="h6">{gettext('Author: ')}</Heading>
                        <Heading type="h6" weight="strong">
                            {
                                ng.get('desks')
                                    .userLookup[currentVersion.version_creator]
                                    .display_name
                            }
                        </Heading>
                    </Spacer>
                    <Label text={currentVersion.state} style="hollow" type="warning" />
                </Spacer>
            </Spacer>
        );
    }
}
