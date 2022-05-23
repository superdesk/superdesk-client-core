import React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {IConfigComponentProps} from 'superdesk-api';
import {IMediaConfig} from './interfaces';

type IProps = IConfigComponentProps<IMediaConfig>;

export class Config extends React.PureComponent<IProps> {
    render() {
        const config = this.props.config ?? {
            allowPicture: true,
            allowAudio: true,
            allowVideo: true,
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
                        checked={config.showPictureCrops}
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
            </Spacer>
        );
    }
}
