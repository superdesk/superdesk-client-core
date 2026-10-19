import React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldValueOperational,
    IUrlsFieldConfig,
    IUrlsFieldUserPreferences,
    IUrlObject,
} from 'superdesk-api';
import {Button, IconButton} from 'superdesk-ui-framework/react';
import classNames from 'classnames';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';

type IProps = IEditorComponentProps<IUrlsFieldValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleUrlUpdate = this.handleUrlUpdate.bind(this);
    }

    handleUrlUpdate(index, urlToUpdate: IUrlObject) {
        const urls = this.props.value ?? [];

        this.props.onChange(
            urls.map((urlObj, i) => i === index ? urlToUpdate : urlObj),
        );
    }

    render() {
        const Container = this.props.container;
        const urls = this.props.value ?? [];
        const {readOnly} = this.props;

        return (
            <Container>
                <div className="authoring-urls-field">
                    {urls.map((urlObj, i) => (
                        <div
                            key={i}
                            className={classNames(
                                'authoring-urls-field__item',
                                {'authoring-urls-field__item--read-only': readOnly},
                            )}
                        >
                            <input
                                type="text"
                                className="authoring-field-box"
                                aria-label={gettext('URL')}
                                placeholder={gettext('URL')}
                                value={urlObj.url}
                                onChange={(event) => {
                                    this.handleUrlUpdate(i, {...urlObj, url: event.target.value});
                                }}
                                readOnly={readOnly}
                            />
                            {!readOnly && (
                                <IconButton
                                    icon="remove-sign"
                                    ariaValue={gettext('Remove')}
                                    onClick={() => {
                                        this.props.onChange(urls.filter((_, j) => j !== i));
                                    }}
                                />
                            )}
                            {this.props.config.hideDescription !== true && (
                                <textarea
                                    className="authoring-field-box"
                                    rows={1}
                                    value={urlObj.description}
                                    onChange={(event) => {
                                        this.handleUrlUpdate(i, {...urlObj, description: event.target.value});
                                    }}
                                    placeholder={gettext('Description')}
                                    readOnly={readOnly}
                                />
                            )}
                        </div>
                    ))}
                </div>
                {!readOnly && (
                    <div>
                        <SpacerBlock v gap="16" />

                        <Button
                            text={gettext('Add url')}
                            onClick={() => {
                                this.props.onChange(urls.concat({url: 'https://', description: ''}));
                            }}
                            type="primary"
                        />
                    </div>
                )}
            </Container>
        );
    }
}
