sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/model/PulseChartItem",
    "sap/fiori/cri/model/formatter",
    "sap/m/VBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent",
    "sap/m/FlexBox"
    ],
    /**
     * Pulse Chart Control
     * @param {sap.ui.core.Control} Control - Control
     * @param {sap.ui.thirdparty.d3} d3 - d3
     * @param {sap.ui.core.format.DateFormat} DateFormat - DateFormat
     * @param {sap.ui.model.json.JSONModel} JSONModel - JSONModel
     * @param {sap.fiori.cri.model.PulseChartItem} PulseChartItem - PulseChartItem
     * @param {sap.fiori.cri.model.Formatter} Formatter - Formatter
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {sap.fiori.cri.control.PulseChart} Pulse Chart control
     */
    function (Control, d3, DateFormat, JSONModel, PulseChartItem, Formatter, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        "use strict";
        return Control.extend("sap.fiori.cri.control.PulseChart", {

            /**
             * Metadata for the control
             */
            metadata: {
                properties: {
                    "yAxisMax": {defaultValue: null},
                    "yAxisLabel": {type: "string", defaultValue: "Value"},
                    "xAxisFormat": {type: "string", defaultValue: "MMM yyyy"},
                    "thresholdLowValue": {type: "float", defaultValue: 5},
                    "thresholdHighValue": {type: "float", defaultValue: 15},
                    "actionRequiredValue": {type: "float", defaultValue: 25},
                    "showNoData": {type: "boolean", defaultValue: false},
                    "width": {type: "string", defaultValue:"95%"},
                    "height": {type: "string", defaultValue:"95%"},
                    "showSimplePulse": {type: "boolean", defaultValue: false}
                },
                aggregations: {
                    reactions: {type: "sap.fiori.cri.model.PulseChartItem", multiple: true, singularName: "reaction"},
                    items: {type: "sap.fiori.cri.model.PulseChartItem", multiple: true, singularName: "item"},
                    trendItems: {type: "sap.fiori.cri.model.PulseChartItem", multiple: true, singularName: "trendItem"}
                },
                defaultAggregation: "items",
                events: {
                    itemSelect: {
                        parameters: {
                            items: {type: "array"},
                            control: {type: "object"}
                        }
                    }
                }
            },

            formatter: Formatter,

            /**
             * Control initialization
             */
            init: function () {

            },

            bindAggregation: function(sKey, oBindingInfo) {
                if (!oBindingInfo.length) {
                    oBindingInfo.length = 1000000;
                }
                return Control.prototype.bindAggregation.apply(this, arguments);
            },

            selectDataPointAtIndex: function (iIndex) {
                var dataPoint = this.dataPoints[iIndex];
                this.selectDataPoint(dataPoint, true);
            },

            /**
             * Renderer for the control
             * @param {sap.ui.core.RenderManager} oRenderManager - Render Manager
             * @param {sap.fiori.cri.control.PulseChart} oControl - This control
             */
            renderer: function (oRenderManager, oControl) {
                var oLayout = oControl.createChartLayoutContainer();

                oRenderManager.write("<div");
                oRenderManager.writeControlData(oControl);
                oRenderManager.writeClasses();
                oRenderManager.write(">");
                oRenderManager.renderControl(oLayout);
                oRenderManager.write("</div>");
            },

            /**
             * Handler for after rendering the control
             */
            onAfterRendering: function () {
                this.refresh();
            },

            refresh: function () {
                var that = this;

                var margin = {
                    top: 20,
                    left: 50,
                    bottom: 30,
                    right: 20
                };
                var padding = 40;

                var thresholdLowValue = this.getThresholdLowValue() || 5;
                var thresholdHighValue = this.getThresholdHighValue() || 15;
                var actionRequiredValue = this.getActionRequiredValue() || 25;

                var oParentControl = this.getParent().$(); // Retrieve jQuery object from parent control.

                var width = this.getWidth().replace("px", "") || 300;
                var height = this.getHeight().replace("px", "") || 300;

                if (height.indexOf("%") != -1) {
                    var percentHeight = height.replace("%", "") / 100;
                    height = oParentControl.height() * percentHeight - margin.top - margin.bottom;
                    height = (height > 0 ? height : 300);
                }

                if (width.indexOf("%") != -1) {
                    var percentWidth = width.replace("%", "") / 100;
                    width = oParentControl.width() * percentWidth - margin.left - margin.right;
                    width = (width > 0 ? width : 300);
                }

                width = parseFloat(width);
                height = parseFloat(height);

                var onResizeEnd = function () {
                    this.rerender();
                }.bind(this);

                if (!this.resizeHandler) {
                    this.resizeHandler = sap.ui.core.ResizeHandler.register(this.getParent(), onResizeEnd);
                }

                //var width = oParentControl.width() - margin.left - margin.right;
                //var height = oParentControl.height() - margin.top - margin.bottom;

                //width = (width > 0 ? width : 100);
                //height = (height > 0 ? height : 100);

                // Setup scales
                var xScale = d3.time.scale().range([padding, width - padding * 2]);
                var yScale = d3.scale.linear().range([height - padding, padding]);
                var green = "#61a656";
                var orange = "#f8ac29";//"yellow"//"#e17b24";
                var red = "#d32030";
                var colorScale = d3.scale.linear().range([green, orange, red]).domain([0, thresholdLowValue, thresholdHighValue, 100]);

                // Setup X Axis
                var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

                var bShowSimplePulse = this.getShowSimplePulse();

                if (bShowSimplePulse) {
                    var yearFormat = "%b %Y";
                } else {
                    var yearFormat = "%B %Y";
                }

                var pulseLineStroke = bShowSimplePulse ? "#346187" : "url(#pulse-line-gradient)";

                xAxis.tickFormat(d3.time.format.multi([
                    ["", function (d) {
                        return d.getHours > 0 || d.getMinutes() > 0;
                    }],
                    ["%b %-d", function(d) {
                        var ticks = xScale.ticks();
                        return ticks[0].getDate() != ticks[2].getDate();
                    }],
                    [yearFormat, function(d) { return true; }]
                ]));


                var yAxis = d3.svg.axis().scale(yScale).orient("left");

                // Setup pulse line
                var line = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) {
                        return xScale(d.date);
                    })
                    .y(function (d, i) {
                        var data = d3.select(this).data()[0];
                        var sum = 0;
                        var history = 2;
                        for(var j = history; j >= 0; j--) {
                            if (i - j >= 0) {
                                sum += data[i - j].value;
                            } else {
                                history -= 1;
                            }
                        }

                        return yScale(sum / (history + 1));

                    });

                // Setup trend line
                var trendLine = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) {
                        return xScale(d.date);
                    })
                    .y(function (d) {
                        return yScale(d.value);
                    });


                // Create root svg
                var eVis = d3.select("#" + this.sParentId);

                eVis.select("svg").remove();

                this.rootSvg = eVis.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                this.svg = this.rootSvg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                if (this.getItems().length == 0) {
                    if (this.getShowNoData()) {
                        this.svg.append("text")
                            .attr("transform", "translate(" + (((width + margin.left + margin.right) / 2) - margin.left) + "," + ((height + margin.top + margin.bottom) / 2) + ")")
                            .style("text-anchor", "middle")
                            .text("No Data");
                    }
                    return;
                }


                var lastReactionDate = new Date(0);
                var reactionBlocks = [];

                var reactions = this.getReactions();
                var reactionData = [];
                reactions.forEach(function (d) {
                    var date = d.getDate();
                    var endDate = d.getEndDate();

                    if (date > lastReactionDate) {
                        lastReactionDate = date;
                    }

                    reactionBlocks.push({
                        start: date,
                        end: endDate
                    });

                    reactionData.push({
                        date: d.getDate(),
                        //label: d.getLabel()
                        label: sap.ui.core.IconPool.getIconInfo('alert').content
                    });
                });

                // Parse data into points
                var data = this.parseLine(this.getItems());
                this.dataPoints = data;

                var trendData = this.parseLine(this.getTrendItems());

                // Determine axis extents
                var allData = data.concat(trendData);

                var pulseExtents = d3.extent(allData, function (d) {
                    return d.date;
                });

                var reactionExtents = d3.extent(reactionData, function (d) {
                    return d.date;
                });

                var xExtents = [pulseExtents[0].getTime() || 0, Math.max(pulseExtents[1] || 0, reactionExtents[1] || 0)];

                var yExtents = this.getYAxisMax() ? [0, this.getYAxisMax()] : d3.extent(allData, function (d) {
                    return Math.max(d.value, 0);
                });

                var maxY = yExtents[1];
                if (maxY == 0) {
                    yExtents[1] = 100;
                } else if (yExtents[0] == yExtents[1]) {
                    yExtents[0] = 0;
                    yExtents[1] = 100;
                }

                if (xExtents[0] == xExtents[1]) {
                    var startDate = new Date(xExtents[0]);
                    var endDate = new Date(xExtents[0]);
                    xExtents[0] = startDate.setDate(startDate.getDate() - 15);
                    xExtents[1] = endDate.setDate(endDate.getDate() + 15);
                }

                xScale.domain(xExtents).nice();
                yScale.domain(yExtents).nice();

                // X Axis Styles
                yAxis.tickFormat(function (d) {
                    return d + "%";
                });

                //X Axis
                var xAxisGroup = this.svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // Y Axis
                this.svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -40)
                    .attr("x", -height / 2)
                    .style("text-anchor", "middle")
                    .text(this.getYAxisLabel());

                // Reference Lines
                var referenceLines = this.svg.append("g")
                    .attr("class", "reference-lines");

                if (!bShowSimplePulse) {
                    var x1 = xScale(xExtents[0]) - padding;
                    var x2 = xScale(xExtents[1]) + padding;
                    this.addReferenceLine(referenceLines, padding - margin.left / 2, x2, yScale(thresholdLowValue), "Medium Risk Factor");
                    this.addReferenceLine(referenceLines, padding - margin.left / 2, x2, yScale(thresholdHighValue), "High Risk Factor");
                    // this.addReferenceLine(referenceLines, x1, x2, yScale(actionRequiredValue), "Action Required");
                }

                var zoomed = false;
                var zoomBrush = d3.svg.brush()
                    .x(xScale);

                var zoomBrushGroup = this.svg.append("g")
                    .attr("class", "zoom-brush")
                    .call(zoomBrush);

                zoomBrushGroup.selectAll("rect")
                    .attr("height", height)
                    .style("fill", "rgba(144,144,144,0.2)");

                var zoomReset = this.svg.append("g")
                    .attr("class", "zoom-reset")
                    .attr("transform", function (d) {
                        var mid = (xScale.range()[1] - xScale.range()[0]) / 2;
                        return "translate(" + mid + "," + (height - 13) + ")";
                    })
                    .style("visibility", "hidden");

                var zoomResetRect = zoomReset.append("rect")
                    .attr("x", "-44px")
                    .attr("y", "-13px")
                    .attr("width", "88px")
                    .attr("height", "26px")
                    .attr("shape-rendering", "crispEdges")
                    .style("cursor", "pointer")
                    .style("stroke", "#bfbfbf")
                    .style("stroke-width", "1px")
                    .style("fill", "transparent")
                    .on("mouseover", function (d) {
                        d3.select(this).style("stroke", "#427cac");
                    })
                    .on("mouseout", function (d) {
                        d3.select(this).style("stroke", "#bfbfbf");
                    });

                zoomReset.append("text")
                    .style("pointer-events", "none")
                    .style("dominant-baseline", "central")
                    .style("text-anchor", "middle")
                    .style("font-size", "0.875rem")
                    .text("Reset Zoom");


                // Line Gradient
                this.svg.append("linearGradient")
                    .attr("id", this.getId().replace("_", ""))
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", 0).attr("y1", yScale(0))
                    .attr("x2", 0).attr("y2", yScale(100))
                    .selectAll("stop")
                    .data([
                        {offset: "0%", color: colorScale(0)},
                        {offset: thresholdLowValue + "%", color: colorScale(thresholdLowValue)},
                        {offset: thresholdHighValue + "%", color: colorScale(thresholdHighValue)}
                    ])
                    .enter().append("stop")
                    .attr("offset", function (d) {
                        return d.offset;
                    })
                    .attr("stop-color", function (d) {
                        return d.color;
                    });


                // Reaction Lines

                var reactionLines = this.svg.selectAll(".reactionLine")
                    .data(reactionData);

                var newLines = reactionLines.enter().append("g")
                    .attr("class", "reactionLine");

                newLines.append("line")
                    .attr("stroke", "darkgray")
                    .attr("stroke-width", "2px")
                    .attr("stroke-dasharray", "4, 2")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", 0)
                    .attr("y2", height);

                newLines.append("text")
                    .attr("fill", "darkgray")
                    .attr("x", 3)
                    .attr("dominant-baseline", "hanging")
                    .style("font-family","SAP-icons")
                    .text(function (d) {
                        return d.label;
                    });

                reactionLines.attr("transform", function (d) {
                    return "translate(" + xScale(d.date) + ",0)";
                });

                // Pulse Line
                var pulseData = {};

                data.sort(function (a, b) {
                    return a.date.getTime() - b.date.getTime();
                });

                data.forEach(function (d) {
                    var dateKey = d.date.toDateString();
                    var dateKeyMax = pulseData[dateKey] ? Math.max(pulseData[dateKey].max, d.value) : d.value;
                    var itemsOnDate = pulseData[dateKey] ? pulseData[dateKey].items : [];
                    itemsOnDate.push(d);
                    pulseData[dateKey] = {
                        max: dateKeyMax,
                        items: itemsOnDate
                    };
                });

                var currentBlockIndex = reactionBlocks.length > 0 ? 0 : null;
                var inReactionBlock = false;

                var lineSegData = [];
                var reactedLineSegments = [];
                var normalLineSegments = [];

                for (var date in pulseData) {
                    var pulseLinePoint = {
                        date: new Date(date),
                        value: pulseData[date].max
                    };


              /*      if (currentBlockIndex != null && currentBlockIndex < reactionBlocks.length) {
                        var block = reactionBlocks[currentBlockIndex];

                        if(!inReactionBlock && pulseLinePoint.date < block.start) {
                            lineSegData.push(pulseLinePoint);
                        } else if (!inReactionBlock && pulseLinePoint.date >= block.start) {
                            inReactionBlock = true;
                            normalLineSegments.push(lineSegData);
                            lineSegData = [pulseLinePoint];
                        } else if(inReactionBlock && pulseLinePoint.date >= block.start && pulseLinePoint.date < block.end) {
                            lineSegData.push(pulseLinePoint);
                        } else if(inReactionBlock && pulseLinePoint.date >= block.end) {
                            inReactionBlock = false;
                            reactedLineSegments.push(lineSegData);
                            lineSegData = [pulseLinePoint];

                            currentBlockIndex += 1;
                        }
                    } else {
                        lineSegData.push(pulseLinePoint);
                    }*/
                    lineSegData.push(pulseLinePoint);
                }

                if(inReactionBlock) {
                    reactedLineSegments.push(lineSegData);
                } else {
                    normalLineSegments.push(lineSegData);
                }


                var linePaths = [];

                reactedLineSegments.forEach(function (pathData) {
                    var path = that.svg.append("path")
                        .datum(pathData)
                        .attr("class", "line gradient-line")
                        .attr("d", line);

                    linePaths.push(path);
                });

                normalLineSegments.forEach(function (pathData) {
                    var path = that.svg.append("path")
                        .datum(pathData)
                        .attr("class", "line gradient-line")
                        .attr("d", line);

                    linePaths.push(path);
                });

                // Trend Line
                this.svg.append("path")
                    .datum(trendData)
                    .attr("class", "line")
                    .attr("d", trendLine);


                if (!this._oPopover) {
                    this._oPopover = sap.ui.xmlfragment("sap.fiori.cri.view.PulsePopover", this);
                    this.addDependent(this._oPopover);
                    this._oPopover.setModel(new JSONModel());
                    this._oPopover.getModel().setProperty("/valueLabel", this.getYAxisLabel());
                }

                var popover = this._oPopover;
                
                var filteredPulseData = {};
                var filteredData = data.filter(function(d){ return d.visible;});
                
                filteredData.forEach(function (d) {
                    var dateKey = d.date.toDateString();
                    var dateKeyMax = filteredPulseData[dateKey] ? Math.max(filteredPulseData[dateKey].max, d.value) : d.value;
                    var itemsOnDate = filteredPulseData[dateKey] ? filteredPulseData[dateKey].items : [];
                    itemsOnDate.push(d);
                    filteredPulseData[dateKey] = {
                        max: dateKeyMax,
                        items: itemsOnDate
                    };
                });

                var pointData = [];
                for (var pointDate in filteredPulseData) {
                    pointData.push({
                        date: new Date(pointDate),
                        value: filteredPulseData[pointDate].max,
                        items: filteredPulseData[pointDate].items
                    });
                }

                var dataPoints = this.svg.selectAll(".point")
                    .data(pointData)
                    .enter().append("circle")
                    .attr("class", "point")
                    .attr("cx", function (d) {
                        return xScale(d.date);
                    })
                    .attr("cy", function (d) {
                        return yScale(d.value);
                    });

                dataPoints
                    .filter(function (d) {
                        return d.items.length == 1;
                    })
                    .attr("stroke", function (d) {
                        //var inReaction = false;

                        if(reactionBlocks.length > 0) {
                            reactionBlocks.forEach(function (reactionBlock) {
                                if(d.date > reactionBlock.start && d.date < reactionBlock.end) {
                                    return "lightgrey";
                                    //inReaction = true;
                                } 
                            })
                        }
                        return d.items.filter(function (el) { if(el.icon) {return(el.icon);} }).length === 1 ? "white" : colorScale(d.value);	
                    })
                    .attr("fill", "white")
                    .attr("r", 8);

                dataPoints
                    .filter(function (d) {
                        return d.items.length > 1;
                    })
/*                    .attr("stroke", function (d) {
                        var inReaction = false;

                        if(reactionBlocks.length > 0) {
                            reactionBlocks.forEach(function (reactionBlock) {
                                if(d.date > reactionBlock.start && d.date < reactionBlock.end) {
                                    inReaction = true;
                                }
                            })
                        }

                        return inReaction ? "lightgrey" : colorScale(d.value);
                    })*/
                    .attr("stroke", function (d) {
                        //var inReaction = false;

                        if(reactionBlocks.length > 0) {
                            reactionBlocks.forEach(function (reactionBlock) {
                                if(d.date > reactionBlock.start && d.date < reactionBlock.end) {
                                    return "lightgrey";
                                    //inReaction = true;
                                } 
                            })
                        }
                        return d.items.filter(function (el) { if(el.icon) {return(el.icon);} }).length > 0 ? "white" : colorScale(d.value);	
                    })
/*                    .attr("fill", function (d) {
                        var inReaction = false;

                        if(reactionBlocks.length > 0) {
                            reactionBlocks.forEach(function (reactionBlock) {
                                if(d.date > reactionBlock.start && d.date < reactionBlock.end) {
                                    inReaction = true;
                                }
                            })
                        }

                        return inReaction ? "lightgrey" : colorScale(d.value);
                    })*/
                    .attr("fill", function (d) {
                        //var inReaction = false;

                        if(reactionBlocks.length > 0) {
                            reactionBlocks.forEach(function (reactionBlock) {
                                if(d.date > reactionBlock.start && d.date < reactionBlock.end) {
                                    return "lightgrey";
                                    //inReaction = true;
                                } 
                            })
                        }
                        return d.items.filter(function (el) { if(el.icon) {return(el.icon);} }).length > 0 ? "white" : colorScale(d.value);	
                    })
/*                    .attr("r", function (d) {
                    	return d.items.filter(function (el) { if(el.icon) { return(el.icon );} }).length > 0 ? 12 : 6;
                    });*/
                    .attr("r",8)

                dataPoints.on("mouseover", function (d) {
                    var d3This = d3.select(this);
                    d.oldStroke = d3This.attr("stroke");
                    d3.select(this).attr("stroke", "grey");
                    popover.getModel().setProperty("/dataPoint", d);
                    popover.openBy(this);
                })
                    .on("mouseout", function (d) {
                        d3.select(this).attr("stroke", d.oldStroke);
                        popover.close();
                    })
                    .on("click", function (d) {
                        d3.event.stopPropagation();
                        d3.select(this).attr("stroke", d.oldStroke);
                        popover.close();
                        var boundItems = [];
                        d.items.forEach(function(item) {
                            boundItems.push(item.item);
                        });

                        that.selectedItems = boundItems;

                        that.fireEvent("itemSelect", {
                            items: boundItems,
                            control: this
                        });
                    });

                this.rootSvg.on("click", function () {
                    if (that.selectedItems) {
                        that.selectedItems = null;

                        popover.close();
                        var boundItems = [];

                        that.fireEvent("itemSelect", {
                            items: boundItems,
                            control: this
                        });
                    }
                });

                var pointLabels = this.svg.selectAll(".pointLabel")
                    .data(pointData.filter(function (d) {
                        return d.items.filter(function (el) { if(el.icon) {return(el.icon);} }).length > 0;
                    }));

                pointLabels.enter().append("text")
                    .attr("class", "pointLabel")
                    .style("pointer-events", "none")
                    .style("dominant-baseline", "central")
                    .style("text-anchor", "middle")
                    .style("fill", function (d) {
                    	//return d.items.length > 1 ? colorScale(d.value) : "white" ;  
                    	return colorScale(d.value);
                    })
                   /* .style("stroke", function (d) {
                    	return d.items.length > 1 ? "white" : colorScale(d.value);  
                    	//return colorScale(d.value);
                    })*/
                    //.style("font-weight", "bold")
                    .style("font-family","SAP-icons");

                pointLabels
                    .attr("transform", function (d) {
                        return "translate(" + xScale(d.date) + "," + yScale(d.value) + ")";
                    })
                    .text(function (d) {
                        // return d.items.length > 9 ? "9+" : d.items.length;
                        //return sap.ui.core.IconPool.getIconInfo('document-text').content;
                        return sap.ui.core.IconPool.getIconInfo(d.items.filter(function (el) { if(el.icon) { return(el.icon);} }).sort(function(a,b) { return (a.priority || 1000)-(b.priority || 1000);})[0].icon).content;
                    });

                this.svg.selectAll(".axis path")
                    .style("fill", "none")
                    .style("stroke", "none")
                    .style("shape-rendering", "crispEdges");

                this.svg.selectAll(".axis line")
                    .style("fill", "none")
                    .style("stroke", "none")
                    .style("shape-rendering", "crispEdges");

                this.svg.selectAll(".x.axis path")
                    .style("display", "none");

                this.svg.selectAll(".x.axis path")
                    .style("display", "none");

                this.svg.selectAll(".axis text")
                    .style("font-size", "11px");

                this.svg.selectAll(".reference-line")
                    .style("stroke-dasharray", "3, 3")
                    .style("stroke-opacity", "0.9")
                    .style("stroke-width", "1")
                    .style("stroke", "rgba(157, 170, 187, 0.7)");

                this.svg.selectAll(".reference-label")
                    .style("fill", "grey")
                    .style("font-size", "12px");

                this.svg.selectAll(".line")
                    .style("fill", "none")
                    .style("stroke-width", "3px");

                this.svg.selectAll(".gradient-line")
                    .style("stroke", "url(#" + this.getId().replace("_", "") + ")");

                this.svg.selectAll(".point")
                    .style("stroke-width", "1.5px");


                // Zoom selection
                var zoomFunction = function () {
                    zoomBrush.clear();
                    zoomBrushGroup.call(zoomBrush);
                    xAxisGroup.transition().call(xAxis)
                        .selectAll(".axis text")
                        .style("font-size", "11px");
                    reactionLines.transition().attr("transform", function (d) {
                        return "translate(" + xScale(d.date) + ",0)";
                    });

                    linePaths.forEach(function (path) {
                        path.transition().attr("d", line);
                    });

                    dataPoints.transition().attr("cx", function (d) {
                        return xScale(d.date);
                    })
                        .attr("cy", function (d) {
                            return yScale(d.value);
                        });

                    pointLabels.transition()
                        .attr("transform", function (d) {
                            return "translate(" + xScale(d.date) + "," + yScale(d.value) + ")";
                        });
                };

                zoomBrush.on("brushend", function () {
                    var zoomExtents = zoomBrush.extent();

                    var minZoomPeriod = 1000 * 3600 * 24 * 7;
                    if (zoomExtents[0].getTime() == zoomExtents[1].getTime()) {
                        return;
                    } else if ( zoomExtents[1].getTime() - zoomExtents[0].getTime() < minZoomPeriod ) {
                        var zoomMidpoint = (zoomExtents[1].getTime() - zoomExtents[0].getTime()) / 2 + zoomExtents[0].getTime();
                        zoomExtents[0] = new Date(zoomMidpoint - minZoomPeriod / 2);
                        zoomExtents[1] = new Date(zoomMidpoint + minZoomPeriod / 2);
                    }

                    xScale.domain(zoomExtents);
                    zoomFunction();
                    zoomReset.style("visibility", "visible");
                    zoomed = true;
                });

                zoomResetRect.on("click", function (d) {
                    if (zoomed) {
                        xScale.domain(xExtents).nice();
                        zoomFunction();
                        zoomReset.style("visibility", "hidden");
                        zoomed = false;
                    }
                });

                if (bShowSimplePulse) {
                    var aRemovedComponents = [".point", ".pointLabel"];
                    aRemovedComponents.forEach(function(sComponent) {
                        var oSelection = that.svg.selectAll(sComponent);
                        oSelection.remove();
                    });
                    var oPulseChildren = this.svg[0][0].childNodes;
                    oPulseChildren.forEach(function(oChild) {
                        if(oChild.classList.value == "x axis") {
                            while(oChild.childNodes.length != 3) {
                                oChild.childNodes[1].remove();
                            }
                        } else if(oChild.classList.value == "y axis") {
                            while(oChild.childNodes.length != 4) {
                                oChild.childNodes[1].remove();
                            }
                        } else if(oChild.classList.value == "zoom-brush" || oChild.classList.value == "zoom-reset") {
                            oChild.remove();
                        }
                    });

                    this.svg.selectAll(".reference-label")
                        .style("fill", "grey")
                        .style("font-size", "10px");

                    var leftX = padding - margin.left/2;
                    var rightX = width - padding + margin.right;
                    var bottomY = -padding + margin.bottom;
                    var topY = -height + padding - margin.top;

                    this.addAxisLines(this.svg, leftX, rightX, bottomY, topY);
                }
            },

            selectDataPoint: function (oDataPoint, bSelected) {

                var popover = this._oPopover;

                this.svg.selectAll(".point")
                    .filter(function (d) {
                        return (d == oDataPoint);
                    }).each(function (d) {
                    popover.getModel().setProperty("/dataPoint", d);
                    popover.openBy(this);
                });
            },

            /**
             * Parses an array into data points
             * @param {sap.fiori.cri.model.PulseChartItem[]} cItems - Array of pulse chart items
             * @returns { {date: Date, value: float}[] } Array of data points
             */
            parseLine: function (cItems) {
                var lineData = [];
                var dates = [];

                for (var i = 0; i < cItems.length; i++) {
                    var item = cItems[i];

                    var date = new Date(item.getDate().getTime() - (item.getValue() * 60 * 1000)); //item.getDate();
                    /*
                     while (dates.indexOf(date.getTime()) != -1) {
                     date = new Date(date.getTime() - (item.getValue() * 60 * 1000));
                     }
                     */
                    dates.push(date.getTime());

                    lineData.push({
                        date: date,
                        label: item.getLabel(),
                        value: item.getValue(),
                        icon: item.getData() && item.getData().Icon,
                        priority: item.getData() && item.getData().Priority,
                        formattedValue: this.formatter.percentage(item.getValue() / 100.0),
                        item: item,
                        visible: item.getData() && item.getData().Visible
                    });
                }

                lineData.sort(function (a, b) {
                    if (a.date.getTime() < b.date.getTime()) { return 1; }
                    if (a.date.getTime() == b.date.getTime()) { return 0; }
                    return -1;
                });

                return lineData;
            },

            /**
             * Adds a reference line to the chart
             * @param {*} referenceLineGroup - D3 svg group
             * @param {float} x1 - Starting x position
             * @param {float} x2 - Ending x position
             * @param {float} y - Y position
             * @param {string} label - Label for the reference line
             */
            addReferenceLine: function (referenceLineGroup, x1, x2, y, label) {
                var referenceLabelPadding = 5;

                referenceLineGroup.append("line")
                    .attr("class", "reference-line medium")
                    .attr("x1", x1 + referenceLabelPadding).attr("y1", y)
                    .attr("x2", x2).attr("y2", y)
                    .style("strokeWidth", 1);

                referenceLineGroup.append("text")
                    .attr("class", "reference-label")
                    .attr("transform", "translate(" + (x1 + referenceLabelPadding) + "," + (y - referenceLabelPadding) + ")")
                    .text(label);
            },

            /**
             * Adds axis lines to the chart
             * @param (*) oSVG - D3 SVG Group
             */

            addAxisLines: function(oSVG, leftX, rightX, bottomY, topY) {
                var axis = oSVG.selectAll(".x.axis");

                axis.append("line")
                    .attr("class", "x axis")
                    .attr("x1", leftX).attr("y1", bottomY)
                    .attr("x2", rightX).attr("y2", bottomY)
                    .attr("stroke", "darkgray")
                    .attr("stroke-width", "0.5px");

                axis.append("line")
                    .attr("class", "y axis")
                    .attr("x1", leftX).attr("y1", bottomY)
                    .attr("x2", leftX).attr("y2", topY)
                    .attr("stroke", "darkgray")
                    .attr("stroke-width", "0.5px");
            },

            /**
             * Create the layout container for the chart
             * @returns {sap.ui.core.Control} Layout container for the chart
             */
            createChartLayoutContainer: function () {
                var oChartLayout = new VBox({
                    alignItems: FlexAlignItems.Start,
                    justifyContent: FlexJustifyContent.Start
                });

                var height = this.getHeight() || "300px";
                var width = this.getWidth() || "300px";
                var oChartFlexBox = new FlexBox({
                    height: height,
                    width: width,
                    alignItems: FlexAlignItems.Start
                });

                this.sParentId = oChartFlexBox.getIdForLabel();
                oChartLayout.addItem(oChartFlexBox);

                return oChartLayout;
            }
        });
    });