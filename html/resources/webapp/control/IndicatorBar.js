sap.ui.define([
        "sap/ui/core/Control",
        "sap/ui/core/format/NumberFormat",
        "sap/ui/thirdparty/d3",
        "sap/m/VBox",
        "sap/m/FlexAlignItems",
        "sap/m/FlexJustifyContent",
        "sap/m/FlexBox"
    ],
    /**
     * Indicator Bar
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.core.format.NumberFormat} NumberFormat Number formatter
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Indicator Bar
     */
    function (Control, NumberFormat, d3, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.IndicatorBar", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"},
                    "label" : {type: "string", defaultValue: ""},
                    "color" : {type: "string", defaultValue: null},
                    "value" : {type: "float", defaultValue: 1.0},
                    "maxValue": {type:"float", defaultValue:null},
                    "showValueLabel": {type: "boolean", defaultValue:true},
                    "scale": {type: "string", defaultValue:" "},
                    "padding": {type:"float", defaultValue:8}
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
                var data = [];


                var oEntry = {
                    label:this.getLabel(),
                    color:this.getColor(),
                    value:this.getValue()
                };

                data.push(oEntry);

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
                    if (this.redraw) {
                        this.redraw();
                    }
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
                    .attr("fill", "rgba(211,225,236,0.8)")
                    .attr("opacity", 0)
                    .style("cursor", "pointer");

                enterBars.append("text")
                    .attr("class", "labelTexts sapMLabel")
                    .attr("fill", "#666666") //Class uses 'color', svg needs 'fill'
                    .attr("dominant-baseline", "central")
                    .style("pointer-events", "none");

                enterBars.append("text")
                    .attr("class", "valueText")
                    .attr("dominant-baseline", "central")
                    .attr("text-anchor", "start")
                    .attr("fill", "#666666")
                    .style("pointer-events", "none");

                enterBars.append("rect")
                    .attr("class", "valueRects")
                    .style("pointer-events", "none");


                this.redraw = function () {
                    bars = this.d3SVG.selectAll(".bar");

                    var maxBarValue = this.getMaxValue() ||  d3.max(this.nodeData, function (d) {
                            return d.value;
                        });

                    var numberOfBars = this.nodeData.length;
                    var barPadding = this.getPadding();
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

                    var showValue = that.getShowValueLabel();
                    var maxLabelTextWidth = 0;
                    labelTexts.each(function () {
                        maxLabelTextWidth = Math.max(maxLabelTextWidth, this.getBBox().width);
                    });

                    var barStart = maxLabelTextWidth + barPadding * 2 + barPadding; //TEXT WIDTH + TEXT PADDING + RECT PADDING

                    var maxValueTextWidth = 0;
                    var valueTexts;
                    var barMaxWidth = that.canvasWidth - barStart - barPadding - maxValueTextWidth - barPadding; //SVG WIDTH - BAR START - BAR END PADDING

                    var valueRects = bars.selectAll('.valueRects').attr("y", barRectYOffset + barPadding)
                        .attr("height", barHeight - barPadding * 2)
                        .attr("x", barStart)
                        .attr("fill", function (d) {
                            return d.color || d3.rgb(52, 103, 154).toString();
                        });

                    if (showValue) {
                        valueTexts = bars.select(".valueText").attr("x", barStart)
                            .text(function (d) {
                                var format = NumberFormat.getFloatInstance({
                                    style: "short",
                                    minFractionDigits: 0,
                                    maxFractionDigits: 1
                                });
                                return format.format(d.value.toString()) + that.getScale();
                            });
                        valueTexts.attr("x", function (d) {
                            var barEndPos = barStart + d.value / maxBarValue * barMaxWidth - 20;
                            return barEndPos + barPadding;
                        })
                            .attr("y", "-15")
                            .attr("fill", function (d) {
                                return d.color || d3.rgb(52, 103, 154).toString();
                            });


                        valueTexts.each(function () {
                            maxValueTextWidth = showValue ? Math.max(maxValueTextWidth, this.getBBox().width) : 0;
                        });
                    }

                    valueRects.attr("width", function (d) {
                        return Math.max(d.value / maxBarValue * barMaxWidth, barPadding);
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