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
        return Control.extend("sap.fiori.cri.control.VisualFilterVBarChart", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"},
                    "barColor": {type: "string", defaultValue:"rgb(52, 103, 154)"},
                    "dataPointRadius": {type: "number", defaultValue:"4"},
                    "showNoData": {type: "boolean", defaultValue:"true"},
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
                    },
                    deselect: {
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

                /*START OF VISUAL FILTER SPECIFIC*/

                var columns = this.d3SVG.selectAll(".column")
                    .data(this.nodeData);

                var axisLine = this.d3SVG.selectAll(".axisLine")
                    .data(this.nodeData.length ? [this.nodeData] : []);

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

                enterColumns.append("rect")
                    .attr("class", "bar")
                    .attr("rx", 0)
                    .attr("ry", 0)
                    .attr("fill", this.getBarColor())
                    .style("pointer-events", "none");

                enterColumns.append("text")
                    .attr("class", "labelTexts sapMLabel")
                    .attr("fill", "#666666") //Class uses 'color', svg needs 'fill'
                    .attr("dominant-baseline", "start")
                    .attr("text-anchor", "middle")
                    .style("pointer-events", "none");

                var axisLineEnter = axisLine.enter().append("line")
                    .attr('class', 'axisLine');

                enterColumns.append("text")
                    .attr("class", "valueTexts sapMLabel")
                    .attr("dominant-baseline", "start")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#666666")
                    .style("pointer-events", "none");

                this.redraw = function () {
                    this.d3SVG.selectAll(".no-data").remove();

                    if (this.nodeData.length == 0) {
                        if (this.getShowNoData()) {
                            this.d3SVG.append("text")
                                .attr("class", "no-data sapMLabel")
                                .attr("fill", "#666666")
                                .attr("transform", "translate(" + (this.canvasWidth / 2) + "," + (this.canvasHeight / 2) + ")")
                                .style("text-anchor", "middle")
                                .text("No Data");
                        }
                        return;
                    }

                    var maxBarValue =  d3.max(this.nodeData, function (d) {
                        return d.value;
                    });

                    var numberOfColumns = this.nodeData.length;
                    var columnPadding = 8;
                    var columnTotalWidth = this.canvasWidth / numberOfColumns;
                    var columnWidth = Math.min(columnTotalWidth, 36);
                    var columnRectXOffset = -(columnWidth / 2);


                    columns = this.d3SVG.selectAll(".column");

                    columns.attr("transform", function (d, i) {
                        var columnMid = columnTotalWidth * i + columnTotalWidth / 2;
                        return "translate(" + columnMid + ",0)";
                    });

                    var selectionRects = columns.selectAll('.selectionRect')
                        .attr("x", -(columnTotalWidth / 2))
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

                    var lineY = maxLabelTextHeight + columnPadding;
                    var columnStart = lineY; //TEXT WIDTH + TEXT PADDING + RECT PADDING

                    axisLineEnter
                        .attr("stroke-width", 0.5)
                        .attr("stroke", "#666666")
                        .attr("x1", 0)
                        .attr("y1", this.canvasHeight - lineY)
                        .attr("x2", this.canvasWidth)
                        .attr("y2", this.canvasHeight - lineY);

                    var valueTexts = columns.selectAll('.valueTexts')
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

                    var columnMaxHeight = that.canvasHeight - columnStart - columnPadding - maxValueTextHeight;

                    var heightScale = d3.scale.linear().domain([0, 1, maxBarValue]).range([0, 5, columnMaxHeight]);

                    valueTexts.attr("y", function (d) {
                        return that.canvasHeight - columnStart - heightScale(d.value) - columnPadding;
                    });

                    columns.selectAll('.bar')
                        .attr("y", function (d) {
                            return that.canvasHeight - columnStart - heightScale(d.value);
                        })
                        .attr("x", columnRectXOffset + columnPadding)
                        .attr("width", columnWidth - 2 * columnPadding)
                        .attr("height", function (d) {
                            return heightScale(d.value);
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