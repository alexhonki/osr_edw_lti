sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/ui/core/format/NumberFormat",
    "sap/m/VBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent",
    "sap/m/FlexBox"
    ],
    /**
     * Visual Filter Line Chart
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.ui.core.format.NumberFormat} NumberFormat Number formatter
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Visual Filter Line Chart
     */
    function (Control, d3, NumberFormat, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.VisualFilterLine", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"},
                    "lineColor": {type: "string", defaultValue:"rgb(52, 103, 154)"},
                    "lineWidth": {type: "number", defaultValue:"2"},
                    "dataPointRadius": {type: "number", defaultValue:"4"},
                    "selectedItem": {type:"any"}
                },
                aggregations: {
                    items: {type: "sap.fiori.cri.control.VisualFilterItem", multiple: true, singularName: "item"}
                },
                defaultAggregation: "items",
                events: {
                    select: {
                        parameters: {
                            item: {type: "sap.fiori.cri.control.VisualFilterItem"}
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

                var height = this.getHeight() || "300px";
                var width = this.getWidth() || "300px";
                var oChartFlexBox = new FlexBox({
                    height: height,
                    width: width,
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
                var cItems = this.getItems();
                var data = [];

                for (var i = 0; i < cItems.length; i++) {
                    var oEntry = {};
                    for (var j in cItems[i].mProperties) {
                        oEntry[j] = cItems[i].mProperties[j];
                    }
                    oEntry.boundData = cItems[i];
                    data.push(oEntry);
                }

                this.nodeData = data;

                var width = "100%";
                var height = "100%";

                var oParentControl = this.getParent().$(); // Retrieve jQuery object from parent control.

                if (this.getHeight() == "100%") {
                    height = oParentControl.height();
                    height = (height > 0 ? height : 300);
                }

                if (this.getWidth() == "100%") {
                    width = oParentControl.width();
                    width = (width > 0 ? width : 300);
                }

                var viz = d3.select("#" + this.sParentId);
                this.d3SVG = viz.append("svg")
                    .attr("width", width)
                    .attr("height", height);

                this.canvasWidth = $("#" + this.sParentId).width();
                this.canvasHeight = $("#" + this.sParentId).height();

                var onResizeEnd = function () {
                    if (this.getHeight() == "100%") {
                        height = oParentControl.height();
                        height = (height > 0 ? height : 300);
                    }

                    if (this.getWidth() == "100%") {
                        width = oParentControl.width();
                        width = (width > 0 ? width : 300);
                    }

                    this.d3SVG.attr("width", width).attr("height", height);
                    this.canvasWidth = $("#" + this.sParentId).width();
                    this.canvasHeight = $("#" + this.sParentId).height();
                    this.redraw();
                }.bind(this);

                if (!this.resizeHandler) {
                    this.resizeHandler = sap.ui.core.ResizeHandler.register(this, onResizeEnd);
                }
                var that = this;

                /*START OF VISUAL FILTER LINE SPECIFIC*/

                var columns = this.d3SVG.selectAll(".column")
                    .data(this.nodeData);

                var enterColumns = columns.enter().append("g")
                    .attr("class", "column");

                enterColumns.append("rect")
                    .attr("class", "selectionRect")
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("fill", "rgba(211,225,236,0.8)")
                    .attr("opacity", 0)
                    .style("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this).attr("opacity", 1);
                    })
                    .on("mouseout", function () {
                        if (!(d3.select(this.parentNode).classed('selected'))) {
                            d3.select(this).attr("opacity", 0);
                        }
                    });

                enterColumns.append("text")
                    .attr("class", "labelTexts sapMLabel")
                    .attr("fill", "#666666") //Class uses 'color', svg needs 'fill'
                    .attr("dominant-baseline", "start")
                    .attr("text-anchor", "middle")
                    .style("pointer-events", "none");

                this.d3SVG.append("line")
                    .attr('class', 'axisLine')
                    .attr("stroke-width", 0.5)
                    .attr("stroke", "#666666")
                    .attr("x1", 0);

                enterColumns.append("text")
                    .attr("class", "valueTexts")
                    .attr("dominant-baseline", "start")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#666666")
                    .style("pointer-events", "none");

                this.d3SVG.append("path")
                    .attr("class", 'dataPointLine')
                    .attr("stroke", this.getLineColor() || d3.rgb(52, 103, 154).toString())
                    .attr("stroke-width", this.getLineWidth() || 2)
                    .attr("fill", "none");

                enterColumns.append("circle")
                    .attr("class", "valuePoints")
                    .attr("r", this.getDataPointRadius() || 4)
                    .attr("fill", function (d) {
                        return that.getLineColor() || d3.rgb(52, 103, 154).toString();
                    })
                    .style("pointer-events", "none");

                this.redraw = function () {
                    var maxBarValue =  d3.max(this.nodeData, function (d) {
                        return d.value;
                    });

                    var numberOfColumns = this.nodeData.length;
                    var columnPadding = 8;
                    var columnTotalWidth = this.canvasWidth / numberOfColumns;
                    var columnRectXOffset = -(columnTotalWidth / 2);
                    var columnWidth = columnTotalWidth;

                    columns = this.d3SVG.selectAll(".column");

                    columns.attr("transform", function (d, i) {
                        var columnMid = columnTotalWidth * i + columnTotalWidth / 2;
                        return "translate(" + columnMid + ",0)";
                    });

                    var selectionRects = columns.selectAll('.selectionRect')
                        .attr("x", columnRectXOffset)
                        .attr("width", columnTotalWidth)
                        .attr("height", this.canvasHeight);

                    selectionRects.filter(function (d) {
                            return d.boundData.getData() == that.getSelectedItem();
                        }).each(function (d) {
                            d3.select(this.parentNode).classed('selected', true);
                            d3.select(this.parentNode).selectAll('.labelTexts').style('font-weight', "bold");
                            d3.select(this.parentNode).selectAll('.valueText').style('font-weight', "bold");
                            d3.select(this).attr("opacity", 1);
                        });

                    var labelTexts = columns.selectAll('.labelTexts')
                        .attr("y", this.canvasHeight - columnPadding)
                        .text(function (d) {
                            return d.label;
                        });

                    var maxLabelTextHeight = 0;
                    labelTexts.each(function () {
                        maxLabelTextHeight = Math.max(maxLabelTextHeight, this.getBBox().height);
                    });

                    var lineY = maxLabelTextHeight + columnPadding * 2;
                    var columnStart = lineY + columnPadding; //TEXT WIDTH + TEXT PADDING + RECT PADDING

                    this.d3SVG.selectAll('.axisLine')
                        .attr("y1", this.canvasHeight - lineY)
                        .attr("x2", this.canvasWidth)
                        .attr("y2", this.canvasHeight - lineY);

                    var valueTexts = columns.selectAll('.valueTexts')
                        .attr("y", columnStart)
                        .text(function (d) {
                            var format = NumberFormat.getFloatInstance({
                                style:"short",
                                minFractionDigits: 0,
                                maxFractionDigits: 1
                            });
                            return format.format(d.value);
                        });

                    selectionRects.on("click", function (d) {
                        var oItem = d.boundData.getData();

                        // Deselect all columns
                        columns.classed('selected', false);
                        selectionRects.attr().attr("opacity", 0);
                        labelTexts.style('font-weight', null);
                        valueTexts.style('font-weight', null);

                        if (that.getSelectedItem() == oItem) {
                            that.setSelectedItem(null);

                            that.fireEvent("deselect", {
                                item: d.boundData
                            });
                        } else {
                            that.setSelectedItem(oItem);

                            d3.select(this.parentNode).classed('selected', true);
                            d3.select(this.parentNode).selectAll('.labelTexts').style('font-weight', "bold");
                            d3.select(this.parentNode).selectAll('.valueText').style('font-weight', "bold");
                            d3.select(this).attr("opacity", 1);

                            that.fireEvent("select", {
                                item: d.boundData
                            });
                        }
                    });

                    var maxValueTextHeight = 0;
                    valueTexts.each(function () {
                        maxValueTextHeight = Math.max(maxValueTextHeight, this.getBBox().height);
                    });

                    var columnMaxHeight = that.canvasHeight - columnStart - columnPadding - maxValueTextHeight - columnPadding * 2;

                    var x = d3.scale.linear().domain([0, that.nodeData.length]).range([0, that.canvasWidth]);
                    var y = d3.scale.linear().domain([0, maxBarValue]).range([that.canvasHeight - columnStart, that.canvasHeight - columnStart - columnMaxHeight]);

                    var line = d3.svg.line()
                        .x(function(d,i) {
                            return x(i);
                        })
                        .y(function (d) {
                            return y(d.value);
                        });

                    this.d3SVG.selectAll('.dataPointLine')
                        .attr("transform", function(d){
                            return "translate(" + (columnRectXOffset + columnWidth) + ",0)";
                        })
                        .attr("d", line(that.nodeData));

                    var valuePoints = columns.selectAll('.valuePoints')
                        .attr("cx", columnRectXOffset + columnWidth / 2)
                        .attr("cy", columnStart);

                    valueTexts.attr("y", function (d) {
                        return that.canvasHeight - columnStart - d.value / maxBarValue * columnMaxHeight - columnPadding * 2;
                    });

                    valuePoints.attr("cy", function (d) {
                        return that.canvasHeight - columnStart - d.value / maxBarValue * columnMaxHeight;
                    });
                }.bind(this);

                this.redraw();
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