import React from 'react';
import {ToggleBox} from 'superdesk-ui-framework/react';
import {IArticle, IVocabularyItem} from 'superdesk-api';
import {Card} from 'core/ui/components/Card';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';

interface IProps {
    renditions: IArticle['renditions'];
    cropSizes: Array<IVocabularyItem>;
    wrapper: React.ComponentType;
}

export class ImageCrops extends React.PureComponent<IProps> {
    render() {
        const {renditions, cropSizes} = this.props;

        const Wrapper = this.props.wrapper;

        return (
            <Wrapper>
                <ToggleBox variant="simple" title={gettext('Show/hide crops')} margin="none">
                    <div className="image-crops-container">
                        {
                            cropSizes
                                .map((cropSize, i) => (
                                    <Card borderRadius={0} key={i}>
                                        <div className="image-crop">
                                            <img
                                                src={renditions[cropSize.name].href}
                                                style={{maxWidth: '100%', maxHeight: '100%'}}
                                            />
                                        </div>

                                        <SpacerBlock v gap="8" />

                                        <div className="image-crop--label">{cropSize.name}</div>
                                    </Card>
                                ))
                        }
                    </div>
                </ToggleBox>
            </Wrapper>
        );
    }
}
