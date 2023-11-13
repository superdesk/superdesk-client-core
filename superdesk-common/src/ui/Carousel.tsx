import * as React from 'react';
import {Carousel} from '@superdesk/primereact/carousel';

export class CarouselAsd extends React.PureComponent<any> {
    render() {
        const productTemplate = (image: any) => {
            return (
                <img src={image.src} alt={image.alt} />
            );
        };

        return (
            <Carousel
                numScroll={1}
                numVisible={1}
                orientation="horizontal"
                itemTemplate={productTemplate}
                value={this.props.images}
            />
        );
    }
}
