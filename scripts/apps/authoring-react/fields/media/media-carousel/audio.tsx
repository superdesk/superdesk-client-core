import React from 'react';
import {Spacer} from 'core/ui/components/Spacer';
import {IArticle} from 'superdesk-api';
import {mediaDetailsPadding} from '../constants';

interface IProps {
    renditions: IArticle['renditions'];
    title: JSX.Element;
    removeButton: JSX.Element;
    metadata: JSX.Element;
    paginationBar: JSX.Element;
    titleInput: JSX.Element;
    descriptionInput: JSX.Element;
    readOnly: boolean;
}

export class MediaCarouselAudio extends React.PureComponent<IProps> {
    render() {
        const {
            renditions,
            title,
            removeButton,
            metadata,
            paginationBar,
            titleInput,
            descriptionInput,
        } = this.props;

        return (
            <div>
                <div className="field--media--carousel">
                    <div style={{color: '#fff', padding: 10}}>
                        <Spacer v gap="32" justifyContent="space-between" noWrap style={{height: '100%'}}>
                            <Spacer h gap="16" justifyContent="space-between" noWrap>
                                {title}
                                {removeButton}
                            </Spacer>

                            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                                <audio controls>
                                    {
                                        Object.values(renditions).map(({href}) => (
                                            <source key={href} src={href} />
                                        ))
                                    }
                                </audio>
                            </div>

                            <Spacer v gap="16" noWrap>
                                {metadata}
                                {paginationBar}
                            </Spacer>
                        </Spacer>
                    </div>
                </div>

                {
                    (descriptionInput != null || titleInput != null) && (
                        <div style={{padding: mediaDetailsPadding}}>
                            <Spacer v gap="16" noWrap>
                                {
                                    titleInput != null && (
                                        <div style={{width: '100%'}}>{titleInput}</div>
                                    )
                                }

                                {
                                    descriptionInput != null && (
                                        <div style={{width: '100%'}}>{descriptionInput}</div>
                                    )
                                }
                            </Spacer>
                        </div>
                    )
                }
            </div>
        );
    }
}
