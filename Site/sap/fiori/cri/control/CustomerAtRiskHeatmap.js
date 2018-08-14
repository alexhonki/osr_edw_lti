sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/m/VBox",
    "sap/m/FlexBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent"
    ],
    /**
     * At Risk Customer Heatmap
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @returns {*} Event Overview Bubblechart
     */
    function (Control, d3, VBox, FlexBox, FlexAlignItems, FlexJustifyContent) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.CustomerAtRiskHeatmap",{
            metadata: {
                properties: {
                    showNoData: {type: "boolean", defaultValue: true}
                },
                aggregations: {
                    items: {type: "sap.fiori.cri.control.HeatmapItem", multiple: true, singularName: "item", visibility: "public"}
                },
                defaultAggregation : "items",
                events: {
                    select: {
                        parameters: {
                            minDTC: {type: "sap.ui.model.type.Integer"},
                            maxDTC: {type: "sap.ui.model.type.Integer"},
                            minInfluence: {type: "sap.ui.model.type.Integer"},
                            maxInfluence: {type: "sap.ui.model.type.Integer"}
                        }
                    }
                }
            },
            init: function () {

            },
            createChart: function () {
                var oChartLayout = new VBox({
                    alignItems: FlexAlignItems.Center,
                    justifyContent: FlexJustifyContent.Center
                });

                var oChartFlexBox = new FlexBox({
                    height: "300px",
                    width: "100%",
                    alignItems: FlexAlignItems.Center
                });

                this.sParentId = oChartFlexBox.getIdForLabel();
                oChartLayout.addItem(oChartFlexBox);

                return oChartLayout;
            },
            exit: function () {
                sap.ui.core.ResizeHandler.deregister(this.resizeHandler);
            },
            onAfterRendering: function () {
                var that = this;

                var cItems = this.getItems();
                var data = [];

                for (var i = 0; i < cItems.length; i++) {
                    var oEntry = {};
                    for (var j in cItems[i].mProperties) {
                        oEntry[j] = cItems[i].mProperties[j];
                    }
                    oEntry.boundData = cItems[i];
                    if (!oEntry.hasOwnProperty('id')) {
                        oEntry.id = i;
                    }
                    data.push(oEntry);
                }

                this.nodeData = data;

                var viz = d3.select("#" + this.sParentId);
                var d3SVG = viz.append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%");

                this.canvasWidth = $("#" + this.sParentId).width();
                this.canvasHeight = $("#" + this.sParentId).height();

                var onResizeEnd = function () {
                    this.rerender();
                }.bind(this);

                if (!this.resizeHandler) {
                    this.resizeHandler = sap.ui.core.ResizeHandler.register(this, onResizeEnd);
                }

                if (cItems.length == 0) {
                    if (this.getShowNoData()) {
                        d3SVG.append("text")
                            .attr("transform", "translate(" + (this.canvasWidth / 2) + "," + (this.canvasHeight / 2 + 12) + ")")
                            .style("text-anchor", "middle")
                            .text("No Data");
                    }

                    return;
                }

                var maxDTC = d3.max(data, function (d) { return d.x; });
                var maxInf = d3.max(data, function (d) { return d.y; });

                var margins = {
                    top: 20,
                    right: 20,
                    left: 60,
                    bottom: 40
                };

                var chartHeight = this.canvasHeight - margins.top - margins.bottom;
                var chartWidth = this.canvasWidth - margins.right - margins.left;

                var bucketSize = 3;

                maxInf = Math.ceil((maxInf) / bucketSize) * bucketSize;
                maxDTC = maxDTC + 1;
                var influenceScale = d3.scale.ordinal()
                    .domain(d3.range(0, maxInf + 1, bucketSize))
                    .rangeBands([chartHeight, 0]);

                var dtcScale = d3.scale.ordinal()
                    .domain(d3.range(1, maxDTC))
                    .rangeBands([0, chartWidth]);

                var xRangeBand = dtcScale.rangeBand();
                var yRangeBand = influenceScale.rangeBand();

                var chartGroup = d3SVG.append('g')
                    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

                var xAxisMajor = d3.svg.axis().scale(dtcScale)
                    .tickValues(d3.range(10, maxDTC, 10))
                    .outerTickSize(0.5)
                    .innerTickSize(10);

                var xAxisMajorGroup = chartGroup.append("g")
                    .attr("id", "xAxisMajorGroup")
                    .attr("transform", "translate(0," + chartHeight + ")")
                    .call(xAxisMajor);

                xAxisMajorGroup.selectAll(".tick line")
                    .style("stroke", "black")
                    .style("stroke-width", 1);

                xAxisMajorGroup.selectAll(".tick text")
                    .style("font-size", "0.875rem");

                var xAxisMinor = d3.svg.axis().scale(dtcScale)
                    .outerTickSize(0);

                var xAxisMinorGroup = chartGroup.append("g")
                    .attr("id", "xAxisMinorGroup")
                    .attr("transform", "translate(0," + chartHeight + ")")
                    .call(xAxisMinor);

                xAxisMinorGroup.selectAll(".tick line")
                    .style("stroke", "black")
                    .style("stroke-width", 0.5);

                xAxisMinorGroup.selectAll(".tick text")
                    .remove();

                chartGroup.append("g")
                    .attr("id", "xAxisLabel")
                    .attr("transform", "translate(" + chartWidth / 2 + "," + (chartHeight + margins.bottom) + ")")
                    .append("text")
                    .style("font-size", "0.875rem")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "ideographic")
                    .text("Days to Churn");

                var labelHeight = 16 * 0.875 + 32; //PixelPerEm * LabelSizeInEm + DesiredPadding
                var labelsPossible = (maxInf * yRangeBand) / labelHeight;
                var majorTickInterval = bucketSize;
                if (labelsPossible < maxInf) {
                    var labelsEvery = maxInf / labelsPossible;
                    majorTickInterval = Math.ceil(labelsEvery / bucketSize) * bucketSize;
                }

                var yAxisMajor = d3.svg.axis().scale(influenceScale)
                    .tickValues(d3.range(0, maxInf + 1, majorTickInterval))
                    .orient("left")
                    .outerTickSize(0.5)
                    .innerTickSize(10);

                var yAxisMajorGroup = chartGroup.append("g")
                    .attr("id", "yAxisMajorGroup")
                    .call(yAxisMajor);

                yAxisMajorGroup.selectAll(".tick line")
                    .style("stroke", "black")
                    .style("stroke-width", 1);

                yAxisMajorGroup.selectAll(".tick text")
                    .style("font-size", "0.875rem");

                var yAxisMinor = d3.svg.axis().scale(influenceScale)
                    .orient("left")
                    .outerTickSize(0);

                var yAxisMinorGroup = chartGroup.append("g")
                    .attr("id", "yAxisMinorGroup")
                    .call(yAxisMinor);

                yAxisMinorGroup.selectAll(".tick line")
                    .style("stroke", "black")
                    .style("stroke-width", 0.5);

                yAxisMinorGroup.selectAll(".tick text")
                    .remove();

                chartGroup.append("g")
                    .attr("id", "yAxisLabel")
                    .attr("transform", "translate(" + -margins.left + "," + chartHeight / 2 + ") rotate(-90) ")
                    .append("text")
                    .style("font-size", "0.875rem")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "text-before-edge")
                    .text("Risk (%)");


                var maxValue = d3.max(data, function (d) { return d.measure; });
                var colorScale = d3.scale.linear()
                    .domain([0, maxValue])
                    .range(["rgba(211, 32, 47, 0)", "rgba(211, 32, 47, 1)"]);


                var brushSelect = null;
                var heatmap = chartGroup.selectAll("nodes")
                    .data(this.nodeData.filter(function (d) {
                        return d.x > 0 && d.y > 0;
                    }));

                heatmap.enter()
                    .append("g")
                    .attr("id", function (d) {
                        return "node" + d.id;
                    })
                    .attr("transform", function (d) {
                        return "translate(" + dtcScale(d.x) + "," + influenceScale(d.y) + ")";
                    })
                    .on("mousedown", function (d) {
                        var xy = d3.mouse(d3SVG.node());
                        var canvasX = xy[0];
                        var canvasY = xy[1];

                        var chartX = canvasX - margins.left;
                        var charyY = canvasY - margins.top;

                        brushSelect.extent([[chartX,charyY],[chartX,charyY]]);
                    })
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", xRangeBand)
                    .attr("height", yRangeBand)
                    .attr("fill", function (d) {
                        return colorScale(d.measure);
                    });

                var dtcMax = dtcScale.range().slice(-1).pop();
                var infZero = influenceScale.range().slice(-1).pop();

                var buttonWidth = 88;
                var buttonHeight = 30;
                var resetSelection = d3SVG.append('g').attr('id', "resetSelection")
                    .attr("transform", "translate(" + (dtcMax) + "," + (infZero) + ")")
                    .style("opacity", "0")
                    .on("mouseup", function () {
                        d3.event.stopPropagation();
                        d3.selectAll(".brush").call(brushSelect.clear());
                        resetSelection.style("opacity", "0");
                        heatmap
                            .select("rect")
                            .attr("stroke", null);

                        that.fireEvent("select", {
                            minDTC: null,
                            maxDTC: null,
                            minInfluence: null,
                            maxInfluence: null
                        });
                    });

                resetSelection.append("rect")
                    .attr("x", "-" + (buttonWidth / 2))
                    .attr("y", "0")
                    .attr("width", buttonWidth + "px")
                    .attr("height", buttonHeight + "px")
                    .attr("fill", "#009de0");


                resetSelection.append("text")
                    .attr("y", "15px")
                    .attr("fill", "white")
                    .attr("stroke", "none")
                    .attr("pointer-events", "none")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .text("Reset");

                brushSelect = d3.svg.brush()
                    .x(dtcScale)
                    .y(influenceScale)
                    .on("brushend", function (event) {
                        var extent = brushSelect.extent();

                        var dtcStartIndex = d3.bisect(dtcScale.range(), extent[0][0] + 1) - 1;
                        var dtcEndIndex = d3.bisect(dtcScale.range(), extent[1][0] - 1) - 1;
                        var influenceStartIndex = d3.bisector(d3.descending).right(influenceScale.range(), extent[0][1] + 1);
                        var influenceEndIndex = d3.bisector(d3.descending).right(influenceScale.range(), extent[1][1] - 1);

                        var dtcStart = dtcScale.domain()[dtcStartIndex];
                        var dtcEnd = dtcScale.domain()[dtcEndIndex];
                        var influenceStart = influenceScale.domain()[influenceStartIndex];
                        var influenceEnd = influenceScale.domain()[influenceEndIndex];

                        var startX = dtcScale(dtcStart);
                        var endX = dtcScale(dtcEnd) + xRangeBand;
                        var startY = influenceScale(influenceStart);
                        var endY = influenceScale(influenceEnd) + yRangeBand;

                        brushSelect.extent([[startX,startY],[endX,endY]]);
                        d3.select(this).transition().call(brushSelect);

                        var selectedNodeIds = [];
                        data.forEach(function (d) {
                            if (d.x >= dtcStart && d.x <= dtcEnd && d.y >= influenceEnd && d.y <= influenceStart) {
                                selectedNodeIds.push(d.id);
                            }
                        });


                        resetSelection.style("opacity", "100");

                        heatmap
                            .select("rect")
                            .attr("stroke", null)
                            .filter(function (d) {
                                return selectedNodeIds.indexOf(d.id) > -1;
                            })
                            .attr("stroke", "blue");

                        that.fireEvent("select", {
                            minDTC: dtcStart,
                            maxDTC: dtcEnd,
                            minInfluence: influenceEnd,
                            maxInfluence: influenceStart
                        });
                    });

                chartGroup.append("g")
                    .attr("class", "brush")
                    .call(brushSelect);

                chartGroup.select("rect.extent")
                    .attr("stroke", "#f3f3f3")
                    .attr("fill-opacity", 0.1);
            },
            renderer: {
                render: function (oRm, oControl) {
                    var layout = oControl.createChart();
                    oRm.write("<div");
                    oRm.writeControlData(oControl);
                    oRm.writeClasses();
                    oRm.write(">");
                    oRm.renderControl(layout);
                    oRm.addClass("verticalAlignment");
                    oRm.write("</div>");
                }
            }
        });
    }
);