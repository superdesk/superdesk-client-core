import React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {IConfigComponentProps, IMediaConfig} from 'superdesk-api';
import {defaultAllowedWorkflows} from 'apps/relations/services/RelationsService';

type IProps = IConfigComponentProps<IMediaConfig>;

export class Config extends React.PureComponent<IProps> {
    render() {
        const config: IMediaConfig = this.props.config ?? {
            allowPicture: true,
            allowAudio: true,
            allowVideo: true,
            allowedWorkflows: {
                inProgress: defaultAllowedWorkflows.in_progress,
                published: defaultAllowedWorkflows.published,
            },
        };

        return (
            <Spacer v gap="16">
                <div>
                    <div className="form-label">{gettext('Maximum items allowed')}</div>

                    <input
                        type="number"
                        value={config.maxItems}
                        onChange={(event) => {
                            this.props.onChange({...config, maxItems: parseInt(event.target.value, 10)});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Allow picture')}}
                        checked={config.allowPicture}
                        onChange={(val) => {
                            this.props.onChange({...config, allowPicture: val});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Show crops for pictures')}}
                        checked={config.showPictureCrops ?? false}
                        onChange={(val) => {
                            this.props.onChange({...config, showPictureCrops: val});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Allow video')}}
                        checked={config.allowVideo}
                        onChange={(val) => {
                            this.props.onChange({...config, allowVideo: val});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Allow audio')}}
                        checked={config.allowAudio}
                        onChange={(val) => {
                            this.props.onChange({...config, allowAudio: val});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Allow adding items that are in progress')}}
                        checked={config.allowedWorkflows.inProgress}
                        onChange={(val) => {
                            this.props.onChange({
                                ...config,
                                allowedWorkflows: {
                                    ...config.allowedWorkflows,
                                    inProgress: val,
                                },
                            });
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Allow adding items that are published')}}
                        checked={config.allowedWorkflows.published}
                        onChange={(val) => {
                            this.props.onChange({
                                ...config,
                                allowedWorkflows: {
                                    ...config.allowedWorkflows,
                                    published: val,
                                },
                            });
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Show input for editing title')}}
                        checked={config.showTitleEditingInput ?? false}
                        onChange={(val) => {
                            this.props.onChange({...config, showTitleEditingInput: val});
                        }}
                    />
                </div>
            </Spacer>
        );
    }
}
