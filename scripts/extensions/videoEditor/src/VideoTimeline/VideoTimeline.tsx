import * as React from 'react';
import {debounce} from 'lodash';
import {BarIcon} from './BarIcon';
import {ListThumbnails} from './ListThumbnails';
import VideoEditorContext from '../VideoEditorContext';
import {IThumbnail} from '../interfaces';

interface IProps {
    video: HTMLVideoElement;
    thumbnails: Array<IThumbnail>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number) => void;
}
interface IState {
    currentTime: number;
    thumbnailsRender: Array<IThumbnail>;
    trim: {
        start: number;
        end: number;
    };
}

function getStrTime(secondsTotal: number) {
    let hours: number = Math.floor(secondsTotal / 3600);
    let mins: number = Math.floor((secondsTotal % 3600) / 60);
    let secs: number = Math.floor(secondsTotal % 60);
    let li = Math.floor((secondsTotal * 10) % 10);

    return (
        (hours < 10 ? '0' + hours : hours) +
        ':' +
        (mins < 10 ? '0' + mins : mins) +
        ':' +
        (secs < 10 ? '0' + secs : secs) +
        '.' +
        li
    );
}

export class VideoTimeline extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    declare context: React.ContextType<typeof VideoEditorContext>;
    private controlbar: React.RefObject<HTMLDivElement>;
    private intervalTimer: number;
    private positionX: number;

    constructor(props: IProps) {
        super(props);
        this.state = {
            currentTime: 0,
            thumbnailsRender: [],
            trim: {
                start: this.props.trim.start,
                end: this.props.trim.start,
            },
        };
        this.controlbar = React.createRef();
        this.intervalTimer = 0;
        this.positionX = 0;
        this.handleDrag = debounce(this.handleDrag.bind(this), 5);
        this.handleTimelineClick = this.handleTimelineClick.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.tick = this.tick.bind(this);

        this.handleTimelineClick = this.handleTimelineClick.bind(this);
    }

    componentDidMount() {
        // call tick every 100ms to update current time state
        // Don't use event timeupdate, because cannot set timeloop, default is 250ms
        this.intervalTimer = window.setInterval(this.tick, 100);
        // Use dragover event window to save position X, because event.clientX can not get in Firefox
        document.addEventListener('dragover', this.handleDragOver);
        this.setThumbnailsRender();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.thumbnails !== this.props.thumbnails) {
            this.setThumbnailsRender();
        }
        if (this.props.trim !== prevProps.trim) {
            this.updateTrim(this.props.trim.start, this.props.trim.end);
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
        document.removeEventListener('dragover', this.handleDragOver);
    }

    updateTrim(start: number, end: number) {
        this.setState({
            trim: {
                start: start,
                end: end,
            },
        });
    }

    handleDrag(type: 'left' | 'right') {
        let time = this.getPositionInBar(this.positionX) * this.props.video.duration;

        if (type === 'left') {
            this.updateTrim(time, this.state.trim.end);
        }
        if (type === 'right') {
            this.updateTrim(this.state.trim.start, time);
        }
    }

    handleDragOver(e: DragEvent | React.DragEvent<HTMLDivElement>) {
        if (e.clientX) {
            this.positionX = e.clientX;
        }
    }

    // calculate list of thumbnails will be rendered on the UI because of space limit
    setThumbnailsRender() {
        const width = this.props.thumbnails?.[0]?.width ?? 1;
        const total = Math.floor((this.controlbar.current?.offsetWidth ?? 1) / width);
        // index spacing between each timeline thumbnail
        // e.g. 1 4 7 10 (delta = 3)
        const delta = (this.props.thumbnails.length - 1) / total;
        const thumbnailsIndex = Array.from(
            Array(total + 1).keys(),
            (i) => Math.round(i * delta),
        );
        const thumbnails = this.props.thumbnails.filter((_, index) => thumbnailsIndex.includes(index));

        this.setState({thumbnailsRender: thumbnails});
    }

    tick() {
        // updates the current time state
        let currentTime = this.props.video.currentTime;

        if (currentTime === this.state.currentTime) {
            return;
        }

        if (currentTime <= this.state.trim.end) {
            this.setState({currentTime: currentTime});
        } else if (this.state.trim.end > 0) {
            this.setState({currentTime: this.state.trim.end});
            this.props.video.pause();
        }
    }

    // drag and drop left and right bar.
    handleDragStart(e: React.DragEvent<HTMLDivElement>) {
        // hide drag ghost image
        const img = new Image();

        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(img, 0, 0);
        e.dataTransfer.setData('text/plain', '');
    }

    handleDragEnd() {
        this.setVideoCurrentTime(this.positionX);
        this.props.onTrim(this.state.trim.start, this.state.trim.end);
    }

    // returns a number between 0 and 1
    // e.g. if a video is 60 seconds position 0.25 would represent a position at 15 seconds
    getPositionInBar(pX: number): number {
        const controlbar = this.controlbar.current;

        if (controlbar == null) {
            throw new Error('control bar element is not present');
        }

        var position = (pX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth;

        if (position > 1) {
            return 1;
        } else if (position < 0) {
            return 0;
        } else {
            return Math.floor(position * 1000) / 1000;
        }
    }

    handleTimelineClick(e: React.MouseEvent) {
        let time = this.setVideoCurrentTime(e.clientX);

        if (time < this.state.trim.start) {
            this.props.onTrim(time, this.state.trim.end);
            this.updateTrim(time, this.state.trim.end);
        }
        if (time > this.state.trim.end) {
            this.props.onTrim(this.state.trim.start, time);
            this.updateTrim(this.state.trim.start, time);
        }
    }

    setVideoCurrentTime(pX: number) {
        let time = this.getPositionInBar(pX) * this.props.video.duration;

        this.props.video.currentTime = time;
        this.setState({currentTime: time});
        return time;
    }

    render() {
        const {getClass} = this.context.utilities.CSS;
        const video = this.props.video;
        const left = video ? `${(this.state.trim.start / video.duration) * 100}%` : '0%';
        const right = video ? `${(1 - this.state.trim.end / video.duration) * 100}%` : '0%';

        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={this.state.thumbnailsRender} getClass={getClass} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar} onClick={this.handleTimelineClick}>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--left')}`}
                        style={{width: left}}
                    />
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--right')}`}
                        style={{width: right}}
                    />
                    <div
                        className={getClass('controlbars__progress-output')}
                        style={{left: video ? `${(this.state.currentTime / video.duration) * 100}%` : '0%'}}
                    >
                        <div className={getClass('controlbars__progress-output__content')}>
                            <BarIcon />
                            <div className={getClass('controlbars__progress-output__content__inner')}>
                                {getStrTime(this.state.currentTime)}
                            </div>
                        </div>
                        <div className={getClass('controlbars__progress-output__progress-line')} />
                    </div>
                    <div
                        className={`${getClass('controlbars__wrapper-out')}`}
                        style={{left: left, right: right}}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--left')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('left')}
                            onDragEnd={this.handleDragEnd}
                        >
                            <span className={getClass('controlbars__wrapper__content')}>
                                {getStrTime(this.state.trim.start)}
                            </span>
                        </div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--right')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('right')}
                            onDragEnd={this.handleDragEnd}
                        >
                            <span className={getClass('controlbars__wrapper__content')}>
                                {getStrTime(this.state.trim.end)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
