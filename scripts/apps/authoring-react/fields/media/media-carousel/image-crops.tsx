import React from 'react';
import {ToggleBox} from 'superdesk-ui-framework/react';
import {IArticle} from 'superdesk-api';
import {authoringStorage} from 'apps/authoring-react/data-layer';
import {Card} from 'core/ui/components/Card';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';

interface IProps {
    renditions: IArticle['renditions'];
    wrapper: React.ComponentType;
}

export class ImageCrops extends React.PureComponent<IProps> {
    render() {
        const {renditions} = this.props;
        const cropSizes =
            authoringStorage.getVocabularies()
                .get('crop_sizes')
                .items
                .filter((cropSize) => renditions[cropSize.name] != null);

        if (cropSizes.length < 1) {
            return null;
        }

        const Wrapper = this.props.wrapper;

        return (
            <Wrapper>
                <ToggleBox title={gettext('Show/hide crops')} margin="none">
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
