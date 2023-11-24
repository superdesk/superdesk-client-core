import * as React from 'react';
import {Carousel} from '@superdesk/primereact/carousel';
// import '../../src/ui/thumb-carousel.css';

interface IState {
    height?: number;
}

export class CarouselAsd extends React.PureComponent<any, IState> {
    private el?: HTMLDivElement;

    constructor(props: any) {
        super(props);

        this.state = {
            height: undefined,
        };
    }

    componentDidMount(): void {
        this.setState({
            height: this.el?.clientHeight,
        });
    }

    render() {
        const productTemplate = (image: any) => {
            return (
                <div
                    className="sd-thumb-carousel__item"
                >
                    <div
                        className="sd-thumb-carousel__item-inner"
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
                        />
                    </div>
                </div>
            );
        };

        return (
            <div
                style={{
                    height: this.state.height,
                }}
                ref={(element) => {
                    this.el = element as HTMLDivElement;
                }}
            >
                <Carousel
                    numScroll={1}
                    numVisible={1}
                    orientation="horizontal"
                    indicatorsContentClassName="sd-thumb-carousel__indicators"
                    itemTemplate={productTemplate}
                    value={this.props.images}
                />
            </div>
        );
    }
}
