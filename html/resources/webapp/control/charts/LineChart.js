sap.ui.define([
        "sap/fiori/cri/control/BaseChart",
        "sap/ui/thirdparty/d3",
        "sap/ui/model/json/JSONModel"
    ],
    function (BaseChart, d3, JSONModel) {
        'use strict';
        return BaseChart.extend("sap.fiori.cri.control.charts.LineChart", {
            constructor: function() {
                BaseChart.apply(this, arguments);
                this.chartSettings = {
                    extent: {
                        x: "CATEGORY",
                            y: "TOTAL",
                            yFiltered: "FILTERED",
                            yLabel: "Total",
                            yFilteredLabel: "Filtered"
                    },
                    plotArea: {
                        color: {
                            unfiltered: "steelblue",
                                filtered: "#EFCC2C"
                        },
                        nodeSize: 4
                    }
                };
            },
            renderer: {
            },
            /**
             * Initializes the line chart constants
             * @param oSVG - oSVG canvas
             * @param width - width of container
             * @param height - height of container
             * @returns {number} - if no data, return 0
             */
            setup: function (oSVG, width, height) {
                if (BaseChart.prototype.setup) {
                    BaseChart.prototype.setup.apply(this, arguments);
                }
                if (this.nodeData.length < 1) {
                    return 0;
                }

                this.chartData = this.nodeData;

                // Set variables for ease of use
                this.nodeSize = this.settings.plotArea.nodeSize;
                this.margin = this.settings.margin;

                // Scale set up
                this.scales = {
                    x: d3.time.scale(),
                    y: d3.scale.linear(),
                    xAxis: d3.svg.axis(),
                    yAxis: d3.svg.axis()
                };

                // xAxis padding
                this.axisPadding = {
                    bottom: 130,
                    top: 100,
                    left:-5
                };
            },
            /**
             * Initializes plot scale and size, adjusting for filters and window resize
             * @param oSVG - oSVG canvas
             * @param width - width of container
             * @param height - height of container
             */
            redraw: function (oSVG, width, height) {
                oSVG.selectAll("svg > *").remove();
                if (BaseChart.prototype.redraw) {
                    BaseChart.prototype.redraw.apply(this, arguments);
                }

                if (!oSVG){
                    return;
                }

                if (!this.chartData){
                    this.showNoData(oSVG, width);
                    return;
                }

                // Calculate plot width
                var plotWidth = width - this.margin.left - this.margin.right;
                var plotHeight = height - this.margin.top - this.margin.bottom;

                // Calculate axis height
                var axisHeight = plotHeight - this.axisPadding.top;

                // Specify scale range and domain
                this.scales.x.range([0, plotWidth]);
                this.scales.y.range([(axisHeight), 0]);

                var xValues = [];
                var yValues = [];

                this.chartData.forEach(function (series) {
                    series.values.forEach(function (d) {
                        xValues.push(d.x);
                        yValues.push(d.y);
                    });
                });

                this.scales.x.domain([d3.min(xValues), d3.max(xValues)]);
                this.scales.y.domain([d3.min(yValues), d3.max(yValues)]);

                this.setupAxis(plotWidth);

                this.drawPlotArea(oSVG, width, height);
            },
            /**
             * Calls D3BaseControl parent onAfterRendering()
             */
            onAfterRendering: function () {
                BaseChart.prototype.onAfterRendering.apply(this, arguments);
            },
            /**
             * Creates scales for plot area
             * @param width - width of container
             */
            setupAxis: function(width) {
                var tickTarget = 5;

                this.scales.xAxis
                    .scale(this.scales.x)
                    .ticks(tickTarget)
                    .tickFormat(d3.time.format("%b %Y"))
                    .orient("bottom");


                var yDomain = this.scales.y.domain();

                var span = yDomain[1] - yDomain[0];
                var step = Math.pow(10, Math.floor(Math.log(span / tickTarget) / Math.LN10));
                var error = tickTarget / span * step;

                var rounding = 100;
                error = Math.round(error * rounding) / rounding;

                if (error <= 0.15) {step *= 10;}
                else if (error <= 0.35) {step *= 5;}
                else if (error <= 0.75) {step *= 2;}

                step = Math.max(step, 1);

                yDomain[0] = Math.floor(yDomain[0] / step) * step;
                yDomain[1] = Math.ceil(yDomain[1] / step) * step;

                this.scales.y.domain(yDomain);

                this.scales.yAxis
                    .scale(this.scales.y)
                    .ticks(tickTarget)
                    .orient("left")
                    .tickFormat(d3.format("s"))
                    .innerTickSize(-width);
            },
            /**
             * Draws elements on the SVG canvas
             * @param oSVG - SVG canvas
             * @param width - container width
             * @param height - container height
             */
            drawPlotArea: function(oSVG, width, height) {
                // Creates plot group, shifts to margin of SVG
                var plot = oSVG.append("g")
                    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
                // Append xAxis and adds padding
                plot.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height - this.axisPadding.bottom) + ")")
                    .call(this.scales.xAxis);
                // Append yAxis
                plot.append("g")
                    .attr("class", "y axis")
                    .call(this.scales.yAxis);
                // Axis styling
                plot.selectAll("g.y.axis .tick line")
                    .attr("stroke-width", 1)
                    .attr("stroke", this.settings.plotArea.color.unfiltered)
                    .attr("opacity", 0.2);

                plot.selectAll("g.y.axis text")
                    .attr("transform", "translate(" + this.axisPadding.left + ",0)");

                this.drawPlot(oSVG, plot, width);
                this.drawLegend(oSVG, height, width);


                // Styling of text and path
                plot.selectAll("text")
                    .attr("font-size", "12px");

                plot.selectAll("g.axis path")
                    .attr("fill", "none");

                plot.selectAll("g.x.axis text")
                    .call(this.wrap, 35);

            },
            /**
             * Appends legend to SVG
             * @param oSVG
             * @param height - height of SVG
             * @param width - width of SVG
             */
            drawLegend: function (oSVG, height, width) {


                var heightOfText = 12;
                var axisLegendPadding = 30;
                var legend = oSVG.append("g").attr("class", "legend")
                    .attr("transform", "translate(" + this.margin.left + "," + (height - (heightOfText + axisLegendPadding)) + ")");

                // Append group per key
                var legendItems = legend.selectAll(".item")
                    .data(this.chartData)
                    .enter()
                    .append("g")
                    .attr("class", "item");

                // Appends circle to legend
                legendItems.append("circle")
                    .attr("cx", heightOfText * -1.3)
                    .attr("cy", heightOfText * -0.5)
                    .attr("r", this.nodeSize)
                    .attr("width", heightOfText)
                    .attr("height", heightOfText)
                    .attr("fill", function (d, i) {
                        return d.color;
                    });

                // Appends line through circle
                legendItems.append("line")
                    .attr("x1", heightOfText * -2.5)
                    .attr("y1", heightOfText * -0.5)
                    .attr("x2", heightOfText * 0)
                    .attr("y2", heightOfText * -0.5)
                    .attr("stroke", function (d, i) {
                        return d.color;
                    });

                // Appends key label
                legendItems.append("text")
                    .attr("font-size", heightOfText + "px")
                    .attr("dominant-baseline", "middle")
                    .text(function(d, i){
                        return d.name;
                    });

                legendItems.select("text")
                    .attr("transform", "translate(15, -3)");

                var legendPadding = heightOfText;
                var totalPadding = 0;
                var previousSibling;
                var yPadding = 0;
                var plotWidth = width - this.margin.left - this.margin.right;

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
            },
            /**
             * Filters data for matching X axis labels, populates popover data
             * @param xLabel
             * @returns {Array} - popover formatted values
             */
            getPopoverData: function (xLabel) {
                var popoverData = [];
                var that = this;
                var height = 10;
                var width = 12;

                this.chartData.forEach(function(series) {
                    var value = series.values.find(function (d) {
                        return d.x == xLabel;
                    }).y;

                    if (value) {
                        popoverData.push({
                            name: series.name,
                            HTML: "<svg height=" + '"' + height + 'px" ' +   "width=" + '"' + width + 'px">' +
                            '<circle cx=' + width / 2 + ' cy=' + height / 2 + ' r=' + that.nodeSize + ' fill="' + series.color + '"></circle> ' +
                            '</svg>',
                            value: that.formatValue(value)
                        });
                    }
                });

                return popoverData;
            },
            /**
             * Draws the line path and circle nodes, color and path depending on filter
             * @param oSVG - SVG canvas
             * @param plot - the plot group
             * @param filtered - boolean, if true renders the plot using filter coloring and path
             */
            drawPlot: function (oSVG, plot, width){
                var dateFormat = d3.time.format("%b %Y");
                var lineGroups = plot.selectAll(".series").data(this.chartData).enter();
                var series = lineGroups.append("g")
                    .attr("class", "series");
                // Default values overwritten if filtered = true
                var that = this;
                var xAxis = "x";
                var yAxis = "y";

                // Sets line function for path
                var line = d3.svg.line()
                    .x(function (d) { return that.scales.x(d[xAxis]); })
                    .y(function (d) {return that.scales.y(d[yAxis]); })
                ;

                // Append path between nodes
                series.append("path")
                    .datum(function(d) { return d.values; })
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", function () {
                        return d3.select(this.parentNode).datum().color;
                    })
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .attr("d", line);

                // Defines groups for nodes
                var nodes = series.selectAll(".node")
                    .data(function (d) {
                        return d.values;
                    })
                    .enter()
                    .append("g")
                    .attr("class", "node");

                //Append each node to plot
                nodes.append("circle")
                    .attr("class", "node")
                    .attr("cx", function (d) {return that.scales.x(d[xAxis]); })
                    .attr("cy", function (d) {return that.scales.y(d[yAxis]); })
                    .attr("r", this.nodeSize)
                    .attr("fill", function () {
                        return d3.select(this.parentNode.parentNode).datum().color;
                    })
                    .on("mouseover", function (d){
                        that.createPopover();
                        that._oPopover.getModel().setProperty("/title", dateFormat(d.x));
                        that._oPopover.getModel().setProperty("/values", that.getPopoverData(d.x));
                        that._oPopover.openBy(this);
                    })
                    .on("mouseout", function (d) {
                        that._oPopover.destroy();
                    });
            },
            /**
             * Clears the currently selected nodes
             * @param oSVG - SVG canvas
             */
            clearSelection: function (oSVG){
                var nodeSize = this.nodeSize;
                oSVG.selectAll("circle")
                    .attr("r", nodeSize)
                    .classed("selected", false);
                oSVG.selectAll(".dialogue").remove();
            }
        });
    }
);

