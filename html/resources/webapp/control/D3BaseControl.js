sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/m/VBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent",
    "sap/m/FlexBox"
    ],
    /**
     * Visual Filter Bubble Chart
     * @param {sap.ui.core.Control} Control Control
     * @param {sap.ui.thirdparty.d3} d3 D3
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Visual Filter Horizontal Bars
     */
    function (Control, d3, VBox, FlexAlignItems, FlexJustifyContent, FlexBox) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.D3BaseControl", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"}
                }
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
            },
            init: function () {

            },
            exit: function () {
                sap.ui.core.ResizeHandler.deregister(this.resizeHandler);
            },
            onAfterRendering: function () {
                this.createRootSVG();

                this.updateSize();

                this.setup(this.oSVG, this.canvasWidth, this.canvasHeight);

                this.redraw(this.oSVG, this.canvasWidth, this.canvasHeight);

                var onResizeEnd = function () {
                    this.updateSize();

                    this.redraw(this.oSVG, this.controlWidth, this.controlHeight);
                }.bind(this);

                if (!this.resizeHandler) {
                    this.resizeHandler = sap.ui.core.ResizeHandler.register(this, onResizeEnd);
                }
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
            createRootSVG: function () {
                var viz = d3.select("#" + this.sParentId);
                this.oSVG = viz.append("svg");
            },
            updateSize:function () {
                var oParentControl = this.getParent().$(); // Retrieve jQuery object from parent control.

                var width = this.getWidth().replace("px", "") || 300;
                var height = this.getHeight().replace("px", "") || 300;

                if (height.indexOf("%") != -1) {
                    var percentHeight = height.replace("%", "") / 100;
                    height = oParentControl.height() * percentHeight;
                    height = (height > 0 ? height : 300);
                }

                if (width.indexOf("%") != -1) {
                    var percentWidth = width.replace("%", "") / 100;
                    width = oParentControl.width() * percentWidth;
                    width = (width > 0 ? width : 300);
                }

                width = parseFloat(width);
                height = parseFloat(height);

                this.oSVG.attr("width", width).attr("height", height);

                var oParent = $("#" + this.sParentId);
                this.canvasWidth = oParent.width();
                this.canvasHeight = oParent.height();

                this.controlWidth = width;
                this.controlHeight = height;
            },
            setup: function (oSVG, width, height) {
            },
            redraw: function (oSVG, width, height) {
            }
        });
    }
);