sap.ui.define([
        "sap/ui/core/Control",
        "sap/fiori/cri/control/BaseChart",
        "sap/fiori/cri/control/charts/StackableBarChart",
        "sap/fiori/cri/control/charts/DonutChart",
        "sap/fiori/cri/control/charts/LineChart"
    ],
    function (Control, BaseChart, StackableBarChart, DonutChart, LineChart) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.Chart", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue: "100%"},
                    "height": {type: "string", defaultValue: "100%"},
                    "chartProperties": {type: "object", defaultValue: null},
                    "chartType": {type: "string"},
                    "values": {type: "object", defaultValue: null}
                },
                aggregations: {
                    "_chart": {type: "sap.fiori.cri.control.BaseChart", multiple: false, visibility: "hidden"}
                }
            },
            onBeforeRendering: function () {
                var mSettingsBundle = {
                    "width": this.getWidth(),
                    "height": this.getHeight(),
                    "chartProperties": this.getChartProperties(),
                    "values": this.getValues()
                };

                var sType = this.getChartType();

                var mType = {
                    "column": StackableBarChart,
                    "dual_column": StackableBarChart,
                    "donut": DonutChart,
                    "timeseries_line": LineChart
                };

                var oChartConstructor = mType[sType];

                if (oChartConstructor) {
                    var chart = new oChartConstructor(mSettingsBundle);
                    this.setAggregation("_chart", chart);
                }
            },
            renderer: {
                render: function (oRm, oChartControl) {
                    oRm.write("<div");
                    oRm.writeControlData(oChartControl);
                    oRm.writeClasses();
                    oRm.write(">");
                    oRm.renderControl(oChartControl.getAggregation("_chart"));
                    oRm.write("</div>");
                }
            }
        });
    });