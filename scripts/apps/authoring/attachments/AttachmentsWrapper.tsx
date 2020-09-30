import * as React from 'react';
import {IAttachment, IAttachmentsWrapperProps} from 'superdesk-api';
import {addEventListener, removeEventListener} from 'core/get-superdesk-api-implementation';
import {attachmentsApi} from './attachmentsService';

interface IState {
    attachments: Array<IAttachment>;
}

export function withAttachments<T extends IAttachmentsWrapperProps>(
    WrappedComponent: React.ComponentType<T>,
): React.ComponentClass<Omit<T, 'attachments'>> {
    return class AttachmentsWrapper extends React.Component<Omit<T, 'attachments'>, IState> {
        constructor(props: Omit<T, 'attachments'>) {
            super(props);

            this.state = {
                attachments: [],
            };

            this.onAttachmentsAdded = this.onAttachmentsAdded.bind(this);
            this.onAttachmentUpdated = this.onAttachmentUpdated.bind(this);
            this.onAttachmentRemoved = this.onAttachmentRemoved.bind(this);
        }

        componentDidMount() {
            addEventListener('attachmentsAdded', this.onAttachmentsAdded);
            addEventListener('attachmentUpdated', this.onAttachmentUpdated);
            addEventListener('attachmentRemoved', this.onAttachmentRemoved);

            attachmentsApi.byArticle(this.props.item)
                .then((attachments) => {
                    this.setState({attachments: attachments});
                });
        }

        componentWillUnmount() {
            removeEventListener('attachmentsAdded', this.onAttachmentsAdded);
            removeEventListener('attachmentUpdated', this.onAttachmentUpdated);
            removeEventListener('attachmentRemoved', this.onAttachmentRemoved);
        }

        onAttachmentsAdded(attachments: Array<IAttachment>) {
            this.setState((prevState: IState) => {
                return {
                    attachments: prevState.attachments.concat(attachments),
                };
            });
        }

        onAttachmentUpdated(attachment: IAttachment) {
            this.setState((prevState: IState) => {
                const attachments = [...prevState.attachments];
                const index = attachments.findIndex(
                    (item) => item._id === attachment._id,
                );

                attachments[index] = attachment;

                return {attachments: attachments};
            });
        }

        onAttachmentRemoved(attachment: IAttachment) {
            this.setState((prevState: IState) => {
                return {
                    attachments: prevState.attachments.filter(
                        (item) => item._id !== attachment._id,
                    ),
                };
            });
        }

        render() {
            return (
                <WrappedComponent
                    {...this.props as T}
                    attachments={this.state.attachments}
                />
            );
        }
    };
}
