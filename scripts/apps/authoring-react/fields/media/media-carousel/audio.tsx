import React from 'react';
import {Spacer} from 'core/ui/components/Spacer';
import {IArticle} from 'superdesk-api';

interface IProps {
    renditions: IArticle['renditions'];
    title: JSX.Element;
    removeButton: JSX.Element;
    metadata: JSX.Element;
    paginationBar: JSX.Element;
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
        } = this.props;

        return (
            <div style={{color: '#fff', padding: 10}}>
                <div>
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
        );
    }
}
