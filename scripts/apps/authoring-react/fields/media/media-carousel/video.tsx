import React from 'react';
import {Spacer} from 'core/ui/components/Spacer';
import {VideoComponent} from 'core/ui/components/video';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    title: JSX.Element;
    removeButton: JSX.Element;
    metadata: JSX.Element;
    paginationBar: JSX.Element;
    readOnly: boolean;
}

export class MediaCarouselVideo extends React.PureComponent<IProps> {
    render() {
        const {
            item,
            title,
            removeButton,
            metadata,
            paginationBar,
        } = this.props;

        return (
            <div style={{color: '#fff', padding: 10}}>
                <div>
                    <Spacer v gap="16" justifyContent="space-between" noWrap style={{height: '100%'}}>
                        <Spacer h gap="16" justifyContent="space-between" noWrap>
                            {title}
                            {removeButton}
                        </Spacer>

                        <div>
                            <VideoComponent item={item} width="100%" />
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
