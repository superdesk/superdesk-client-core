import * as d3 from 'd3';
import _ from 'lodash';

PieChartDashboard.$inject = ['colorSchemes'];
export function PieChartDashboard(colorSchemes) {
    return {
        replace: true,
        scope: {
            terms: '=',
            theme: '@',
            colors: '=',
        },
        link: function(scope, element, attrs) {
            var appendTarget = element[0];
            var horizBlocks = attrs.x ? parseInt(attrs.x, 10) : 1;
            var vertBlocks = attrs.y ? parseInt(attrs.y, 10) : 1;

            var graphSettings = { // thightly depends on CSS
                blockWidth: 300,
                blockHeight: 197,
                mergeSpaceLeft: 60, // 30 + 2 + 20
                mergeSpaceBottom: 99, // 30 + 2 + 20 + 47
            };

            var width = graphSettings.blockWidth * horizBlocks + graphSettings.mergeSpaceLeft * (horizBlocks - 1),
                height = graphSettings.blockHeight * vertBlocks + graphSettings.mergeSpaceBottom * (vertBlocks - 1),
                radius = Math.min(width, height) / 2;

            colorSchemes.get((colorsData) => {
                var colorScheme = colorsData.schemes[0];

                var arc = d3.arc()
                    .outerRadius(radius)
                    .innerRadius(radius * 8 / 13 / 2);

                var sort = attrs.sort || null;
                var pie = d3.pie()
                    .value((d: any) => d.doc_count)
                    .sort(sort ? (a, b) => d3.ascending(a[sort], b[sort]) : null);

                var svg = d3.select(appendTarget).append('svg')
                    .attr('width', width)
                    .attr('height', height)
                    .append('g')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

                scope.$watchGroup(['terms', 'colors'], function renderData(newData) {
                    if (!_.isNil(newData[0])) {
                        if (newData[1] !== null) {
                            colorScheme = colorsData.schemes[_.findKey(colorsData.schemes, {name: newData[1]})];
                        }

                        var colorScale = d3.scaleOrdinal()
                            .range(colorScheme.charts);

                        svg.selectAll('.arc').remove();

                        var g = svg.selectAll('.arc')
                            .data(pie(newData[0]))
                            .enter()
                            .append('g')
                            .attr('class', 'arc');

                        g.append('path')
                            .attr('d', (d: any) => arc(d))
                            .style('fill', (d: any) => colorScale(d.data.key) as string);

                        g.append('text')
                            .attr('class', 'place-label')
                            .attr('transform', (d: any) => 'translate(' + arc.centroid(d) + ')')
                            .style('text-anchor', 'middle')
                            .style('fill', colorScheme.text)
                            .text((d: any) => d.data.key);

                        arrangeLabels();
                    }
                });
                function arrangeLabels() {
                    var move = 1;

                    while (move > 0) {
                        move = 0;
                        svg.selectAll('.place-label')
                            .each(rerangeLabels);
                    }
                    function rerangeLabels() {
                        /* jshint validthis: true */
                        var self = this,
                            a = self.getBoundingClientRect();

                        svg.selectAll('.place-label')
                            .each(function() {
                                if (this !== self) {
                                    var b = (this as Element).getBoundingClientRect();

                                    if (Math.abs(a.left - b.left) * 2 < a.width + b.width &&
                                                Math.abs(a.top - b.top) * 2 < a.height + b.height) {
                                        var dx = (Math.max(0, a.right - b.left) +
                                                    Math.min(0, a.left - b.right)) * 0.01,
                                            dy = (Math.max(0, a.bottom - b.top) +
                                                            Math.min(0, a.top - b.bottom)) * 0.02;

                                        // Parse transform manually (d3.transform removed in v4+)
                                        var parseTransform = (transformStr) => {
                                            var match = /translate\(([^,]+),([^)]+)\)/.exec(transformStr);

                                            return match ? [parseFloat(match[1]), parseFloat(match[2])] : [0, 0];
                                        };

                                        var tt = parseTransform(d3.select(this).attr('transform'));
                                        var to = parseTransform(d3.select(self).attr('transform'));

                                        move += Math.abs(dx) + Math.abs(dy);
                                        to = [to[0] + dx, to[1] + dy];
                                        tt = [tt[0] - dx, tt[1] - dy];
                                        d3.select(this).attr('transform', 'translate(' + tt + ')');
                                        d3.select(self).attr('transform', 'translate(' + to + ')');
                                        a = (this as Element).getBoundingClientRect();
                                    }
                                }
                            });
                    }
                }
            });
        },
    };
}
