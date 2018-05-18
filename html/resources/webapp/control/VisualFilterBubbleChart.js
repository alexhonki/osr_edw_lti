var brush;
sap.ui.define([
        "sap/fiori/cri/control/D3BaseControl",
        "sap/fiori/cri/control/Frame",
        "sap/ui/thirdparty/d3"
    ],
    /**
     * Visual Filter Bubble Chart
     * @param {sap.fiori.cri.control.D3BaseControl} BaseControl Base control for D3 controls
     * @param {sap.fiori.cri.control.Frame} Frame Frame
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @returns {*} Visual Filter Horizontal Bars
     */
    function (BaseControl, Frame, d3) {
        'use strict';
        return BaseControl.extend("sap.fiori.cri.control.VisualFilterBubbleChart", {
            metadata: {
                properties: {
                    xAxisLabel: {type: "string", defaultValue: "Impact"},
                    yAxisLabel: {type: "string", defaultValue: "Risk"},
                    xAxisUnit: {type: "string", defaultValue: ""},
                    yAxisUnit: {type: "string", defaultValue: "%"},
                    xAxisColors: {
                        type: "string[]",
                        defaultValue: ["rgb(39,163,221)", "rgb(248,172,31)", "rgb(220,13,14)"]
                    },
                    yAxisColors: {
                        type: "string[]",
                        defaultValue: ["rgb(39,163,221)", "rgb(248,172,31)", "rgb(220,13,14)"]
                    },
                    xAxisThresholds: {type: "object", defaultValue: [0, 50, 100]},
                    yAxisThresholds: {type: "object", defaultValue: [0, 50, 100]},
                    nodeType: {type: "string", defaultValue: "circle"},
                    nodeSize:  {type: "int", defaultValue: 15},
                    showNoData: {type: "boolean", defaultValue: "true"},
                    selectionFrame: {type: "sap.fiori.cri.control.Frame"}
                },
                aggregations: {
                    items: {type: "sap.fiori.cri.control.VisualFilterPlotItem", multiple: true, singularName: "item"}
                },
                defaultAggregation: "items",
                events: {
                    select: {
                        parameters: {
                            items: {
                                type: "sap.fiori.cri.control.VisualFilterPlotItem",
                                multiple: true,
                                singularName: "item"
                            }
                        }
                    },
                    deselect: {
                        parameters: {
                            items: {
                                type: "sap.fiori.cri.control.VisualFilterPlotItem",
                                multiple: true,
                                singularName: "item"
                            }
                        }
                    }
                }
            },
            renderer: {},
            setup: function (oSVG, width, height) {

                this.nodeData = this.loadData();

                if (!oSVG) {
                    return;
                }

                oSVG.selectAll(".no-data").remove();

                if (this.nodeData.length == 0) {
                    this.showNoData(oSVG, width, height);
                    return;
                }

                // Setup margins
                this.margin = {
                    left: 70,
                    right: 20,
                    bottom: 25,
                    top: 10
                };

                this.padding = {
                    left: 8,
                    right: 8,
                    top: 8,
                    bottom: 8
                };

                this.labelPadding = {
                    top: 20,
                    bottom: 10,
                    left: 10,
                    right: 0
                };

                this.nodeType = this.getNodeType() || "circle";
                this.nodeRadius = this.getNodeSize() || 15;
                this.xAxisLabelWidth = 100;
                this.yAxisLabelHeight = 50;

                // Setup scales
                this.scales = {
                    x: d3.scale.linear(),
                    y: d3.scale.linear(),
                    xAxis: d3.svg.axis(),
                    yAxis: d3.svg.axis(),
                    xColor: d3.scale.linear(),
                    yColor: d3.scale.linear()
                };

                this.styles = {
                    node: {
                        stroke: "none",
                        strokeDasharray: "3px",
                        strokeOpacity: "0",
                        selected: {
                            stroke: "#555",
                            strokeDasharray: "4px",
                            strokeOpacity: "0.5"
                        }
                    }
                };

                var that = this;
                this.scales.xAxis
                    .scale(this.scales.x)
                    .orient("bottom")
                    .tickFormat(function (d) {
                        var prefix = d3.formatPrefix(d, 2);
                        var unit = that.getXAxisUnit();
                        unit = (unit ? " " + unit : "");
                        return prefix.scale(d) + prefix.symbol + unit;
                    })
                    .outerTickSize(0);

                this.scales.yAxis
                    .scale(this.scales.y)
                    .orient("left")
                    .tickFormat(function (d) {
                        var prefix = d3.formatPrefix(d, 2);
                        var unit = that.getYAxisUnit();
                        unit = (unit ? " " + unit : "");
                        return prefix.scale(d) + prefix.symbol + unit;
                    })
                    .outerTickSize(0);


                this.drawAxisArea(oSVG, this.margin.left, this.margin.top, width, height);

                this.drawBrushArea(oSVG, this.margin.left, this.margin.top, width, height);

            },
            redraw: function (oSVG, width, height) {

                if (!oSVG) {
                    return;
                }

                oSVG.selectAll(".no-data").remove();

                if (this.nodeData.length == 0) {
                    this.showNoData(oSVG, width, height);
                    return;
                }

                // Update scales based on data
                var xExtent = d3.extent(this.nodeData, function (d) {
                    return d.getXValue();
                });

                var yExtent = d3.extent(this.nodeData, function (d) {
                    return d.getYValue();
                });

                var xRange = Math.max(xExtent[1] - xExtent[0], 1);
                var yRange = Math.max(yExtent[1] - yExtent[0], 1);

                var insetLeft = xRange * (this.padding.left + this.nodeRadius) / width;
                var insetRight = xRange * (this.padding.right + this.nodeRadius) / width;
                var insetTop = yRange * (this.padding.top + this.nodeRadius) / height;
                var insetBottom = yRange * (this.padding.bottom + this.nodeRadius) / height;

                var xColorRange = this.getXAxisColors();
                var yColorRange = this.getYAxisColors();

                var xColorDomain = this.getXAxisThresholds();
                var yColorDomain = this.getYAxisThresholds();

                this.scales.xColor.range(xColorRange).clamp(true);
                this.scales.yColor.range(yColorRange).clamp(true);

                this.scales.xColor.domain(xColorDomain);
                this.scales.yColor.domain(yColorDomain);

                this.scales.x.domain([xExtent[0] - insetLeft, xExtent[1] + insetRight]);
                this.scales.y.domain([yExtent[0] - insetBottom, yExtent[1] + insetTop]);

                this.plotAreaInsets = {
                    left: insetLeft,
                    right: insetRight,
                    top: insetTop,
                    bottom: insetTop
                };

                // Update sizes
                var plotWidth = width - this.margin.left - this.margin.right;
                var plotHeight = height - this.margin.top - this.margin.bottom - this.xAxisLabelHeight;

                // Update scales based on sizes
                this.scales.x.range([0, plotWidth]);
                this.scales.y.range([plotHeight, 0]);

                this.updateAxisArea(oSVG, plotWidth, plotHeight);

                this.updatePlotArea(oSVG, plotWidth, plotHeight);
                this.updateBrushArea(oSVG, width, height);


            },
            showNoData: function (oSVG, width, height) {
                if (this.getShowNoData()) {
                    oSVG.append("text")
                        .attr("class", "no-data sapMLabel")
                        .attr("fill", "#666666")
                        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
                        .style("text-anchor", "middle")
                        .text("No Data");
                }
            },
            loadData: function () {
                return this.getItems() || [];
            },
            drawAxisArea: function (oSVG, xPosition, yPosition, width, height) {
                // Setup axis area
                var axisArea = oSVG.append("g")
                    .attr("class", "axisArea")
                    .attr("transform", "translate(" + xPosition + "," + yPosition + ")");



                var yAxisLabel = axisArea.append("text")
                    .text(this.getYAxisLabel())
                    .attr("font-size", "12px")
                    .attr("text-anchor", "middle")
                    .style("user-select", "none")
                    .attr("transform", "translate(" + ( -60 ) + ", " + (height / 2 - this.margin.bottom) + "), rotate(-90)");

                var xAxisLabel = axisArea.append("text")
                    .attr("class", "x-axis-label")
                    .text(this.getXAxisLabel())
                    .style("user-select", "none")
                    .attr("font-size", "12px");

                this.yAxisLabelHeight = yAxisLabel.node().getBBox().height + this.labelPadding.top + this.labelPadding.bottom;

                var xAxisLabelBBox = xAxisLabel.node().getBBox();
                this.xAxisLabelWidth = xAxisLabelBBox.width + this.labelPadding.left + this.labelPadding.right;
                this.xAxisLabelHeight = xAxisLabelBBox.height + this.labelPadding.bottom + this.labelPadding.top;

                xAxisLabel.attr("transform", "translate(" + (width - xAxisLabelBBox.width - this.labelPadding.right - this.margin.left - this.margin.right) + ", " + (height - this.margin.top - this.margin.bottom) + ")");

                axisArea.append("g")
                    .attr("class", "x axis");

                axisArea.append("g")
                    .attr("class", "y axis");

                this.updateAxisArea(oSVG, width, height);
            },
            updateAxisArea: function (oSVG, width, height) {
                // Update axis area
                var axisArea = oSVG.selectAll(".axisArea")
                    .attr("width", width)
                    .attr("height", height);

                var xAxisLabel = axisArea.selectAll(".x-axis-label");
                var xAxisLabelBBox = xAxisLabel.node().getBBox();
                xAxisLabel.attr("transform", "translate(" + (width / 2 - xAxisLabelBBox.width / 2 - this.labelPadding.left) + ", " + (height + xAxisLabelBBox.height + this.labelPadding.top + this.labelPadding.bottom) + ")");

                this.drawAxis(axisArea.selectAll(".x.axis"), 0, height, this.scales.xAxis);
                this.drawAxis(axisArea.selectAll(".y.axis"), 0, 0, this.scales.yAxis);
            },
            drawAxis: function (axis, xPosition, yPosition, scale) {
                // Setup x-axis
                axis.attr("transform", "translate(" + xPosition + "," + yPosition + ")")
                    .call(scale);

                axis.selectAll("line, path")
                    .attr('fill', 'none')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '0.5px');

                axis.selectAll("text")
                    .style("font-size", "12px")
                    .style("user-select", "none");
            },

            updateSelectedNodes: function (nodes) {
                var that = this;

                var bHasSelection = false;

                nodes.classed("selected", function (node) {
                    bHasSelection = bHasSelection || node.selected;
                    return node.selected;
                });

                nodes.select(".inner")
                    .attr("fill", function (node) {
                        // If this node is selected or no nodes are selected, fill with color
                        if (node.selected || !bHasSelection) {
                            return that.fnNodeFill(node);
                        } else {
                            return "grey";
                        }
                    });
            },

            onBrushed: function(oSVG, xPosition, yPosition) {
                var that = this;

                var extent = that.brush.extent();

                var left = extent[0][0];
                var top = extent[0][1];
                var right = extent[1][0];
                var bottom = extent[1][1];

                var nodes = oSVG.selectAll(".node");

                nodes.each(function (node) {
                    node.selected = false;

                    var nodeCenterX = that.fnNodeX(node) + xPosition;
                    var nodeCenterY = that.fnNodeY(node) + yPosition;

                    var nodeRadius = that.nodeRadius;

                    var nodeLeft = nodeCenterX - nodeRadius;
                    var nodeRight = nodeCenterX + nodeRadius;
                    var nodeTop = nodeCenterY - nodeRadius;
                    var nodeBottom = nodeCenterY + nodeRadius;

                    // if extents contains center point
                    if (left <= nodeCenterX && nodeCenterX <= right && top <= nodeCenterY && nodeCenterY <= bottom) {
                        node.selected = true;
                    }

                    // if node contains extents
                    if (nodeLeft <= left && right <= nodeRight && nodeTop <= top && bottom <= nodeBottom) {
                        node.selected = true;
                    }
                });

                that.updateSelectedNodes(nodes);
            },

            onBrushEnd: function(oSVG, xPosition, yPosition) {
                var that = this;

                var items = [];
                var selectionFrame;
                var extents;

                var nodes = oSVG.selectAll(".node");
                that.updateSelectedNodes(nodes);

                oSVG.selectAll(".node.selected").each(function (node, i) {
                    items.push(node);
                });

                if (items.length > 0) {

                    // Update item extents
                    var xExtent = d3.extent(items, function (item) {
                        return item.getXValue();
                    });

                    var yExtent = d3.extent(items, function (item) {
                        return item.getYValue();
                    });

                    extents = {
                        x: xExtent,
                        y: yExtent
                    };


                    // Update selection frame
                    var scales = that.scales;

                    var extent = that.brush.extent();
                    var left = extent[0][0];
                    var top = extent[0][1];
                    var right = extent[1][0];
                    var bottom = extent[1][1];

                    selectionFrame = new Frame({
                        top: scales.y.invert(top - yPosition),
                        left: scales.x.invert(left - xPosition),
                        bottom: scales.y.invert(bottom - yPosition),
                        right: scales.x.invert(right - xPosition)
                    });
                }

                that.setSelectionFrame(selectionFrame);

                that.fireEvent("select", {
                    selectionFrame: selectionFrame,
                    items: items,
                    extents: extents
                });
            },

            drawBrushArea: function (oSVG, xPosition, yPosition, width, height) {
                var that = this;

                oSVG.append("g")
                    .attr("class", "plotArea")
                    .attr("transform", "translate(" + xPosition + "," + yPosition + ")");


                var x = d3.scale.identity().domain([0, width]),
                    y = d3.scale.identity().domain([0, height]);

                var brush = d3.svg.brush()
                    .x(x)
                    .y(y)
                    .on("brush", function () {
                        that.onBrushed(oSVG, xPosition, yPosition);
                    })
                    .on("brushend", function () {
                        that.onBrushEnd(oSVG, xPosition, yPosition);
                    });

                that.brush = brush;

                oSVG.append("g")
                    .attr("class", "brush")
                    .attr("stroke", "#18C0FF")
                    .attr("stroke-width", "3px")
                    .attr("stroke-opacity", "0.8")
                    .attr("fill", "#18C0FF")
                    .attr("fill-opacity", "0.1")
                    .call(brush);
            },
            updateBrushArea: function (oSVG, width, height) {
                var brush = this.brush;

                var frame = this.getSelectionFrame();

                var extent = brush.extent();

                if (frame) {
                    extent = [
                        [
                            this.scales.x(frame.getLeft()) + this.margin.left,
                            this.scales.y(frame.getTop()) + this.margin.top
                        ],
                        [
                            this.scales.x(frame.getRight()) + this.margin.left,
                            this.scales.y(frame.getBottom()) + this.margin.top
                        ]
                    ];
                }

                d3.selectAll(".brush")
                    .call(brush.clear());
                oSVG.selectAll('.brush')
                    .call(brush.extent(extent));

                this.onBrushed(oSVG,  this.margin.left, this.margin.top);
            },
            simulateClickAndDrag: function (oSVG, mouseStart, mouseFinish) {
                var fnToggleSelected = function (nodes, bSelected) {
                    nodes.classed("selected", bSelected);

                    nodes.select(".outer")
                        .attr("opacity", bSelected ? 1 : 0);
                };

                var that = this;

                fnToggleSelected(oSVG.selectAll(".selected"), false);

                var point = mouseStart;
                var endPoint = mouseFinish;
                var x1 = point[0];
                var y1 = point[1];
                var x2 = endPoint[0];
                var y2 = endPoint[1];
                var deltaX = x2 - x1;
                var deltaY = y1 - y2;

                oSVG.append("rect")
                    .attr("class", "selection")
                    .attr("stroke", "#333")
                    .attr("stroke-dasharray", "3px")
                    .attr("stroke-opacity", "0.8")
                    .attr("fill", "none")
                    .attr("x", x1)
                    .attr("y", y1)
                    .attr("width", deltaX)
                    .attr("height", deltaY);

                // Update selected nodes
                fnToggleSelected(oSVG.selectAll(".selected"), false);

                oSVG.selectAll(".node").each(function (node, i) {
                    var nodeX = that.fnNodeX(node);
                    var nodeY = that.fnNodeY(node);

                    if (nodeX >= x1 && nodeX <= x1 + deltaX &&
                        nodeY >= y2 && nodeY <= y2 + deltaY) {
                        fnToggleSelected(d3.select(this), true);
                    }
                });

                oSVG.selectAll("rect.selection").remove();

                var items = [];
                oSVG.selectAll(".node.selected").each(function (node, i) {
                    items.push(node);
                });

                var extents;

                if (items.length > 0) {
                    var xExtent = d3.extent(items, function (item) {
                        return item.getXValue();
                    });

                    var yExtent = d3.extent(items, function (item) {
                        return item.getYValue();
                    });

                    extents = {
                        x: xExtent,
                        y: yExtent
                    };
                }

                that.fireEvent("select", {
                    items: items,
                    extents: extents
                });
            },
            updatePlotArea: function (oSVG, width, height) {
                var plotArea = oSVG.selectAll(".plotArea");

                var node = plotArea.selectAll(".node")
                    .data(this.nodeData, function (d) {
                        return d.getLabel();
                    });
                this.fnNodeX = function (d) {
                    return this.scales.x(d.getXValue());
                }.bind(this);

                this.fnNodeY = function (d) {
                    return this.scales.y(d.getYValue());
                }.bind(this);

                this.fnNodeFill = function (d) {

                    var xColor = d3.rgb(this.scales.xColor(d.getXValue()));
                    var yColor = d3.rgb(this.scales.yColor(d.getYValue()));

                    var r = (xColor.r + yColor.r) / 2;
                    var g = (xColor.g + yColor.g) / 2;
                    var b = (xColor.b + yColor.b) / 2;

                    var color = d3.rgb(r, g, b);

                    return d.getColor() || color;
                }.bind(this);

                var that = this;

                var offset = 0;
                if (that.getNodeType() == "rect") {
                    offset = that.getNodeSize() / 2;
                }

                var nodeGroupEnter = node.enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) {
                        var x = that.fnNodeX(d) - offset;
                        var y = that.fnNodeY(d) - offset;

                        return "translate(" + x + "," + y + ")";
                    });
                nodeGroupEnter.append(this.nodeType)
                    .attr("class", "inner")
                    .attr("opacity", 0)
                    .attr("r", this.nodeRadius)
                    .attr("width", this.nodeRadius)
                    .attr("height", this.nodeRadius)
                    .attr("fill", this.fnNodeFill)
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.4);

                nodeGroupEnter.append(this.nodeType)
                    .attr("class", "outer")
                    .attr("opacity", 0)
                    .attr("r", this.nodeRadius + 1)
                    .attr("width", this.nodeRadius + 1)
                    .attr("height", this.nodeRadius + 1)
                    .attr("fill", "none")
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.4);

                node
                    .attr("transform", function (d) {
                        var x = that.fnNodeX(d) - offset;
                        var y = that.fnNodeY(d) - offset;
                        return "translate(" + x + "," + y + ")";
                    });

                node
                    .select(".inner")
                    .attr("opacity", 0.4)
                    .attr("r", this.nodeRadius)
                    .attr("width", this.nodeRadius + 1)
                    .attr("height", this.nodeRadius + 1)
                    .attr("fill", this.fnNodeFill);

                node
                    .select(".outer")
                    .attr("r", this.nodeRadius + 1)
                    .attr("width", this.nodeRadius + 1)
                    .attr("height", this.nodeRadius + 1)
                    .attr("opacity", function (d) {
                        return d3.select(this.parentNode).classed("selected") ? 1 : 0;
                    });
            }
        });
    }
);

