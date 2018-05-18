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
     * Visual Filter Horizontal Bars
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.ui.core.format.NumberFormat} NumberFormat Number formatter
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Visual Filter Horizontal Bars
     */
    function (Control, d3, NumberFormat, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.VisualFilterHBar", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"},
                    "entityName": {type: "string", defaultValue:"Events"},
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
                /*START OF VISUAL FILTER HBAR SPECIFIC*/



                var bars = this.d3SVG.selectAll(".bar")
                    .data(this.nodeData);

                var enterBars = bars.enter().append("g")
                    .attr("class", "bar");

                enterBars.append("rect")
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

                enterBars.append("text")
                    .attr("class", "labelTexts sapMLabel")
                    .attr("fill", "#666666") //Class uses 'color', svg needs 'fill'
                    .attr("dominant-baseline", "central")
                    .style("pointer-events", "none");

                enterBars.append("text")
                    .attr("class", "valueText sapMLabel")
                    .attr("dominant-baseline", "central")
                    .attr("text-anchor", "start")
                    .attr("fill", "#666666")
                    .style("pointer-events", "none");

                enterBars.append("rect")
                    .attr("class", "valueRects")
                    .attr("rx", 3)
                    .attr("ry", 3)
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

                    bars = this.d3SVG.selectAll(".bar");

                    var maxBarValue =  d3.max(this.nodeData, function (d) {
                        return d.value;
                    });

                    var numberOfBars = this.nodeData.length;
                    var barPadding = 8;
                    var barTotalHeight = this.canvasHeight / numberOfBars;
                    var barRectYOffset = -(barTotalHeight / 2);
                    var barHeight = barTotalHeight;

                    var labelTexts = bars.selectAll('.labelTexts').attr("x", barPadding).text(function (d) {
                        return d.label;
                    });

                    bars.attr("transform", function (d, i) {
                        var barMid = barTotalHeight * i + barTotalHeight / 2;
                        return "translate(0," + barMid + ")";
                    });

                    var selectionRects = bars.selectAll('.selectionRect')
                        .attr("width", this.canvasWidth)
                        .attr("height", barTotalHeight)
                        .attr("y", barRectYOffset);

                    selectionRects.filter(function (d) {
                            return d.boundData.getData() == that.getSelectedItem();
                        }).each(function (d) {
                            d3.select(this.parentNode).classed('selected', true);
                            d3.select(this.parentNode).selectAll('.labelTexts').style('font-weight', "bold");
                            d3.select(this.parentNode).selectAll('.valueText').style('font-weight', "bold");
                            d3.select(this).attr("opacity", 1);
                        });

                    var maxLabelTextWidth = 0;
                    labelTexts.each(function () {
                        maxLabelTextWidth = Math.max(maxLabelTextWidth, this.getBBox().width);
                    });

                    var barStart = maxLabelTextWidth + barPadding * 2 + barPadding; //TEXT WIDTH + TEXT PADDING + RECT PADDING

                    var valueTexts =  bars.select(".valueText").attr("x", barStart)
                        .text(function (d) {
                            var format = NumberFormat.getFloatInstance({
                            style:"short",
                            minFractionDigits: 0,
                            maxFractionDigits: 1
                        });
                        var value = format.format(d.value);
                        return value;
                    });

                    selectionRects.on("click", function (d) {
                        var oItem = d.boundData.getData();

                        // Deselect all bars
                        bars.classed('selected', false);
                        selectionRects.attr().attr("opacity", 0);
                        labelTexts.style('font-weight', null);
                        valueTexts.style('font-weight', null);

                        // Fire event based on selection state
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

                    var maxValueTextWidth = 0;
                    valueTexts.each(function () {
                        maxValueTextWidth = Math.max(maxValueTextWidth, this.getBBox().width);
                    });

                    var barMaxWidth = that.canvasWidth - barStart - barPadding - maxValueTextWidth - barPadding; //SVG WIDTH - BAR START - BAR END PADDING


                    var valueRects = bars.selectAll('.valueRects').attr("y", barRectYOffset + barPadding)
                        .attr("height", barHeight - barPadding * 2)
                        .attr("x", barStart)
                        .attr("fill", function (d) {
                            return d.color || d3.rgb(52, 103, 154).toString();
                        });

                    valueTexts.attr("x", function (d) {
                        var barEndPos = barStart;
                        if (maxBarValue > 0) {
                            barEndPos += d.value / maxBarValue * barMaxWidth;
                        }
                        return barEndPos + barPadding;
                    });

                    valueTexts.filter(function (d) {
                            return d.value == 0;
                        })
                        .style("font-style", "italic")
                        .attr("x", function (d) {
                            return d3.select(this).attr("x") - barPadding;
                        })
                        .text(function (d) {
                            return "No " + d.label + " " + that.getEntityName();
                        });

                    valueRects.attr("width", function (d) {
                        return Math.max(d.value / maxBarValue * barMaxWidth);
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