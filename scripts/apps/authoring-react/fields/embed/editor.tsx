import React from 'react';
import ng from 'core/services/ng';
import {IEditorComponentProps, IEmbedValueOperational, IEmbedConfig, IEmbedUserPreferences} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {SpacerBlock, Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {EmbedPreview} from './embed-preview';

type IProps = IEditorComponentProps<IEmbedValueOperational, IEmbedConfig, IEmbedUserPreferences>;

interface IState {
    previewEnabled: boolean;
}

function isUrlLike(str: string) {
    return str.match(/^http/i) != null;
}

export class Editor extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            previewEnabled: false,
        };
    }

    render() {
        const Container = this.props.container;
        const {readOnly} = this.props;

        const embedObj = this.props.value ?? {embed: '', description: ''};

        const miniToolbar = (
            <Spacer h gap="8" style={{whiteSpace: 'nowrap'}}>
                {(() => {
                    if (!readOnly && isUrlLike(embedObj.embed)) {
                        return (
                            <Button
                                text={gettext('Generate from URL')}
                                onClick={() => {
                                    ng.get('embedService').get(embedObj.embed).then(({html}) => {
                                        this.props.onChange({
                                            ...embedObj,
                                            embed: html,
                                        });
                                    });
                                }}
                                size="small"
                            />
                        );
                    } else if (this.state.previewEnabled) {
                        return (
                            <Button
                                text={gettext('Hide preview')}
                                onClick={() => {
                                    this.setState({previewEnabled: false});
                                }}
                                size="small"
                            />
                        );
                    } else {
                        return (
                            <Button
                                text={gettext('Preview')}
                                onClick={() => {
                                    this.setState({previewEnabled: true});
                                }}
                                size="small"
                            />
                        );
                    }
                })()}

                {
                    !readOnly && (
                        <Button
                            text={gettext('Clear embed')}
                            onClick={() => {
                                this.props.onChange({
                                    ...embedObj,
                                    embed: '',
                                });
                            }}
                            size="small"
                        />
                    )
                }
            </Spacer>
        );

        return (
            <Container miniToolbar={miniToolbar}>
                <textarea
                    value={embedObj.embed}
                    onChange={(event) => {
                        this.props.onChange({
                            ...embedObj,
                            embed: event.target.value,
                        });

                        if (this.state.previewEnabled) {
                            this.setState({previewEnabled: false});
                        }
                    }}
                    placeholder={gettext('Embed code')}
                    readOnly={readOnly}
                    style={{resize: 'vertical'}}
                />

                <SpacerBlock v gap="8" />

                <textarea
                    value={embedObj.description}
                    onChange={(event) => {
                        this.props.onChange({
                            ...embedObj,
                            description: event.target.value,
                        });
                    }}
                    placeholder={gettext('Description')}
                    readOnly={readOnly}
                    style={{resize: 'vertical'}}
                />

                {
                    this.state.previewEnabled && (
                        <div>
                            <SpacerBlock v gap="16" />

                            <EmbedPreview embedHtml={embedObj.embed} />
                        </div>
                    )
                }
            </Container>
        );
    }
}
