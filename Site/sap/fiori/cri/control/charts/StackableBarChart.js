sap.ui.define([
        "sap/fiori/cri/control/BaseChart",
        "sap/ui/thirdparty/d3",
        "sap/ui/model/json/JSONModel"
    ],
    function (BaseChart, d3, JSONModel) {
        'use strict';
        return BaseChart.extend("sap.fiori.cri.control.charts.StackableBarChart", {
            constructor: function () {
                BaseChart.apply(this, arguments);
                this.chartSettings = {
                    plotArea: {
                        tickColor: "steelblue"
                    },
                    axis: {
                        topPadding: 0,
                        bottomPadding: 80,
                        y: {
                            targetTickCount: 5
                        }
                    }
                };
            },
            metadata: {
                properties: {

                }
            },
            renderer: {

            },
            setup: function (oSVG, width, height) {
                if (BaseChart.prototype.setup) {
                    BaseChart.prototype.setup.apply(this, arguments);
                }
                if (this.nodeData.length < 1) {
                    return 0;
                }

                // Scale set up
                this.scales = {
                    x: d3.scale.ordinal(),
                    xMinor: d3.scale.ordinal(),
                    y: d3.scale.linear()
                };

                this.axis = {
                    x: d3.svg.axis(),
                    y: d3.svg.axis()
                };

                this.chartData = this.nodeData;

                //Becomes node data when correctly formatted
                this.chartData.map(function (series) {
                    series.stack = series.stack || series.name;
                });
            },
            redraw: function (oSVG, width, height) {
                if (BaseChart.prototype.redraw) {
                    BaseChart.prototype.redraw.apply(this, arguments);
                }

                oSVG.selectAll("svg > *").remove();

                var plotWidth = width - this.settings.margin.left - this.settings.margin.right;
                var plotHeight = height - this.settings.margin.top - this.settings.margin.bottom;

                if (!this.chartData){
                    this.showNoData(oSVG, width);
                    return;
                }

                this.setupScales(plotWidth, plotHeight);
                this.setupAxis(plotWidth);
                this.drawChart(oSVG, plotWidth, plotHeight);
            },
            onAfterRendering: function () {
                BaseChart.prototype.onAfterRendering.apply(this, arguments);
            },
            /**
             * Setup scales
             * @param plotWidth - width of SVG plot
             * @param plotHeight
             */
            setupScales: function (plotWidth, plotHeight) {
                var allXValues = [];
                var allYValues = [];
                var stacks = [];

                this.chartData.forEach(function (series) {
                    stacks.push(series.stack);

                    series.values.forEach(function (d) {
                        allXValues.push(d.x);
                        allYValues.push(d.y);
                    });
                });

                this.scales.x.domain(allXValues);
                this.scales.xMinor.domain(stacks);

                var preAligned = [d3.min(allYValues), d3.max(allYValues)];
                var postAligned = this.alignDomainToTicks(preAligned, this.settings.axis.y.targetTickCount);
                this.scales.y.domain(postAligned);

                this.scales.x.rangeRoundBands([0, plotWidth], 0.2);
                this.scales.xMinor.rangeRoundBands([0, this.scales.x.rangeBand()]);
                this.scales.y.range([plotHeight - this.settings.axis.bottomPadding, this.settings.axis.topPadding]);
            },
            /**
             * Creates scales for plot area
             * @param plotWidth - width of container
             */
            setupAxis: function(plotWidth) {
                this.axis.x
                    .scale(this.scales.x)
                    .orient("bottom");

                this.axis.y
                    .scale(this.scales.y)
                    .ticks(this.settings.axis.y.targetTickCount)
                    .orient("left")
                    .tickFormat(d3.format("s"))
                    .innerTickSize(-plotWidth);
            },
            /**
             * Appends axis, plot and legend to SVG
             * @param oSVG
             * @param plotWidth
             * @param plotHeight
             */
            drawChart: function(oSVG, plotWidth, plotHeight) {
                oSVG.selectAll("svg > *").remove();

                var chartArea = oSVG.append("g").attr("transform", "translate(" + this.settings.margin.left + "," + this.settings.margin.top + ")");

                this.drawAxis(chartArea, plotHeight);
                this.drawPlot(chartArea);
                this.drawLegend(oSVG, plotHeight, plotWidth);

            },
            /**
             * Appends axis to SVG
             * @param chartArea - SVG plot area
             * @param plotHeight - height of SVG plot
             */
            drawAxis: function (chartArea, plotHeight) {
                chartArea.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (plotHeight - this.settings.axis.bottomPadding) + ")")
                    .call(this.axis.x);

                chartArea.append("g")
                    .attr("class", "y axis")
                    .call(this.axis.y);

                chartArea.selectAll("g.axis .tick line")
                    .attr("stroke-width", 1)
                    .attr("stroke", this.settings.plotArea.tickColor)
                    .attr("opacity", 0.2);

                chartArea.selectAll("text")
                    .attr("font-size", "12px");

                chartArea.selectAll("g.axis path")
                    .attr("fill", "none");

                chartArea.selectAll("g.x.axis text")
                    .call(this.wrap, this.scales.x.rangeBand());
            },
            /**
             * Filters data for matching X axis labels, populates popover data
             * @param xLabel
             * @returns {Array} - popover formatted values
             */
            getPopoverData: function (xLabel) {
                var popoverData = [];
                var that = this;
                var height = 9;
                var width = 11;
                var squareLength = 9;
                this.chartData.forEach(function(series) {
                    var value = series.values.find(function (d) {
                        return d.x == xLabel;
                    }).y;

                    if (value) {
                        popoverData.push({
                            name: series.name,
                            HTML: "<svg height=" + '"' + height + 'px" ' +   "width=" + '"' + width + 'px">' +
                            '<rect height="' + squareLength + '" width ="' + squareLength + '" fill="' + series.color + '"></rect> ' +
                            '</svg>',
                            value: that.formatValue(value)
                        });
                    }
                });

                return popoverData;
            },
            /**
             * Appends bars to SVG
             * @param chartArea
             */
            drawPlot: function (chartArea){
                var plot = chartArea.append("g").attr("class", "plotArea");
                var that = this;

                var barGroups = plot.selectAll(".series").data(this.chartData).enter();

                var barsForSeries = barGroups.append("g")
                    .attr("class", "series")
                    .attr("transform", function (d) {
                        return "translate(" + that.scales.xMinor(d.stack) + ",0)";
                    });

                var bars = barsForSeries.selectAll(".bar")
                    .data(function (d) {
                        return d.values;
                    })
                    .enter()
                    .append('g')
                    .attr("class", function(d){ return "_" + d.x.replace(/\s+/g, ''); })
                    .on("mouseover", function (d){
                        that.createPopover();
                        that._oPopover.getModel().setProperty("/title", d.x);
                        that._oPopover.getModel().setProperty("/values", that.getPopoverData(d.x));
                        var xSelection =  plot.selectAll("._" + d.x.replace(/\s+/g, ''));
                        that._oPopover.openBy(xSelection[0]);
                    })
                    .on("mouseout", function (d) {
                        that._oPopover.destroy();
                    });


                bars.append("rect")
                    .attr("class","rect")
                    .attr("x", function (d) { return that.scales.x(d.x); })
                    .attr("y", function (d) {
                        if (d.y >= 0 ) {
                            return that.scales.y(d.y);
                        } else {
                            return that.scales.y(0);
                        }
                    })
                    .attr("height", function (d) {
                        if (d.y >= 0) {
                            return that.scales.y(0) - that.scales.y(d.y);
                        } else {
                            return that.scales.y(d.y) - that.scales.y(0);
                        }
                    })
                    .attr("width", this.scales.xMinor.rangeBand())
                    .attr("fill", function () {
                        return d3.select(this.parentNode.parentNode).datum().color;
                    });
            },
            /**
             * Appends legend to SVG
             * @param oSVG
             * @param plotHeight - height of SVG
             * @param plotWidth - width of SVG
             */
            drawLegend: function (oSVG, plotHeight, plotWidth) {
                var heightOfText = 12;
                var axisLegendPadding = 10;

                var legend = oSVG.append("g").attr("class", "legend")
                    .attr("transform", "translate(" + this.settings.margin.left + "," + (plotHeight - (heightOfText + axisLegendPadding)) + ")");


                var legendItems = legend.selectAll(".item")
                    .data(this.chartData)
                    .enter()
                    .append("g")
                    .attr("class", "item");

                legendItems.append("rect")
                    .attr("x", heightOfText * -1.5)
                    .attr("y", heightOfText * -0.5)
                    .attr("width", heightOfText)
                    .attr("height", heightOfText)
                    .attr("fill", function (d) {
                        return d.color;
                    });

                legendItems.append("text")
                    .attr("font-size", heightOfText + "px")
                    .attr("dominant-baseline", "middle")
                    .text(function(d){
                        return d.name;
                    });

                var legendPadding = heightOfText;
                var totalPadding = 0;
                var previousSibling;
                var yPadding = 0;

                legendItems.each(function (d, i) {
                    previousSibling = this.previousSibling;
                    if (previousSibling){
                        totalPadding += previousSibling.getBBox().width + legendPadding;
                    }
                    if (totalPadding + this.getBBox().width > plotWidth){
                        totalPadding = 0;
                        yPadding += 20;
                    }
                    d3.select(this).attr("transform", "translate(" + totalPadding + "," + yPadding + ")");
                });
            }
        });
    }
);

