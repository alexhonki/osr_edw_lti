sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/m/VBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent",
    "sap/m/FlexBox"
    ],
    /**
     * Settings Slider
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Slider
     */
    function (Control, d3, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.SettingsSlider",{
            metadata: {
                properties: {
                    fixed: {type: "boolean", defaultValue: false},
                    min: {type: "float", defaultValue: null},
                    max: {type: "float", defaultValue: null},
                    value: {type: "float", defaultValue: null},
                    unit: {type: "string", defaultValue: ""},
                    prefixUnit: {type: "boolean", defaultValue: false},
                    startSegmentColor: {type: "string", defaultValue: "black"},
                    endSegmentColor: {type:"string", defaultValue: null},
                    startSegmentLabel: {type:"string", defaultValue: ""},
                    endSegmentLabel: {type:"string", defaultValue: ""},
                    pointLabel: {type:"string", defaultValue: ""}
                },
                aggregations: {
                    points: {type: "sap.fiori.cri.control.SettingSliderPoint", multiple: true, singularName: "point", visibility: "public"}
                },
                defaultAggregation : "points"
            },
            init: function () {

            },
            createChart: function () {
                var oChartLayout = new VBox({
                    alignItems: FlexAlignItems.Center,
                    justifyContent: FlexJustifyContent.Center
                });

                var oChartFlexBox = new FlexBox({
                    height: "100px",
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

                var slidePadding = 30;

                var minSlide = this.getMin() || 0;
                var maxSlide = this.getMax() || 1;
                var fixed = this.getFixed();

                var sliderScale = d3.scale.linear().range([slidePadding, this.canvasWidth - 2 * slidePadding]);

                var lines = [];
                var handles = [];
                var points;

                if (!fixed) {
                    sliderScale.domain([minSlide, maxSlide]);
                    var value = this.getValue();

                    points = this.getPoints();
                    lines.push({
                        start: minSlide,
                        end: value,
                        color: this.getStartSegmentColor(),
                        label: this.getStartSegmentLabel()
                    });

                    handles.push({
                        value: value,
                        label: this.getPointLabel()
                    });

                    for (var i = 0; i < points.length; i++) {
                        lines.push({
                            start: lines[lines.length - 1].end,
                            end: points[i].getValue(),
                            color: points[i].getFillColor() || lines[lines.length - 1].color,
                            label: points[i].getSegmentLabel()
                        });

                        handles.push({
                            value: points[i].getValue(),
                            label: points[i].getPointLabel()
                        });
                    }

                    lines.push({
                        start: lines[lines.length - 1].end,
                        end: maxSlide,
                        color: this.getEndSegmentColor() || lines[lines.length - 1].color,
                        label: this.getEndSegmentLabel()
                    });
                } else {
                    sliderScale.domain([0, 1]);
                    points = this.getPoints();

                    var step = 1.0 / (points.length + 2);

                    lines.push({
                        start: 0,
                        end: step,
                        color: this.getStartSegmentColor(),
                        label: this.getStartSegmentLabel()
                    });


                    for (var iIndex = 0; iIndex < points.length; iIndex++) {
                        lines.push({
                            start: lines[lines.length - 1].end,
                            end: lines[lines.length - 1].end + step,
                            color: points[iIndex].getFillColor() || lines[lines.length - 1].color,
                            label: points[iIndex].getSegmentLabel()
                        });

                    }

                    lines.push({
                        start: lines[lines.length - 1].end,
                        end: lines[lines.length - 1].end + step,
                        color: this.getEndSegmentColor() || lines[lines.length - 1].color,
                        label: this.getEndSegmentLabel()
                    });
                }

                var segmentGroup = d3SVG.selectAll(".segmentLine")
                    .data(lines)
                    .enter()
                    .append("g")
                    .attr("class", "segmentLine");

                segmentGroup.append("line")
                    .attr("x1", function (d) {
                        return sliderScale(d.start);
                    })
                    .attr("y1", this.canvasHeight / 2)
                    .attr("x2", function (d) {
                        return sliderScale(d.end);
                    })
                    .attr("y2", this.canvasHeight / 2)
                    .attr("stroke-width", 4)
                    .attr("stroke-linecap", "round")
                    .attr("stroke", function(d) {return d.color;});

                segmentGroup.append("text")
                    .attr("x", function (d) {
                        return sliderScale(d.start + (d.end - d.start) / 2);
                    })
                    .attr("y", this.canvasHeight / 2 + 12)
                    .attr("text-anchor", "middle")
                    .attr("fill", "rgb(154,154,154)")
                    .attr("font-size", "12px")
                    .attr("dominant-baseline", "hanging")
                    .text(function (d) {
                        return d.label;
                    });

                var handleGroup = d3SVG.selectAll(".handles")
                    .data(handles)
                    .enter()
                    .append("g")
                    .attr("class", "handles")
                    .attr("transform", function (d) {
                        var x = sliderScale(d.value);
                        var y = that.canvasHeight / 2;
                        return "translate(" + x + "," + y + ")";
                    });

                handleGroup.append("circle")
                    .attr("r", 12)
                    .attr("fill", "none")
                    .attr("stroke", "rgb(154,154,154")
                    .attr("stroke-width", 3);

                handleGroup.append("text")
                    .attr("y", 12 + 12)
                    .attr("text-anchor", "middle")
                    .attr("fill", "rgb(154,154,154)")
                    .attr("font-size", "12px")
                    .attr("dominant-baseline", "hanging")
                    .text(function (d) {
                        return d.label;
                    });

                var textInputWidth = 80;
                handleGroup.append("foreignObject")
                    .attr("y", -12 - 24)
                    .attr("width", textInputWidth)
                    .attr("x", -textInputWidth / 2)
                    .html("<body><input style='width: 100%' type='text'/></body>");
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