sap.ui.define([
        "sap/fiori/cri/control/D3BaseControl",
        "sap/ui/thirdparty/d3",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/format/NumberFormat"
    ],
    function (D3BaseControl, d3, JSONModel, NumberFormat) {
        'use strict';
        return D3BaseControl.extend("sap.fiori.cri.control.BaseChart", {
            constructor: function () {
                D3BaseControl.apply(this, arguments);
                this.defaultSettings = {
                    margin: {
                        left: 50,
                        right: 25,
                        bottom: 25,
                        top: 10
                    }
                };
            },
            metadata: {
                properties: {
                    "chartProperties": {type: "object", defaultValue: null},
                    "values": {type: "object", defaultValue: null},
                    "dialogueHeight" : {type: "int", defaultValue: 60},
                    "dialogueWidth" : {type: "int", defaultValue: 100},
                    "dialogueTextSize" : {type: "int", defaultValue: 12}
                }
            },
            renderer: {},
            /**
             * Retrieves node data
             * @param oSVG - SVG canvas
             * @param width - width of container
             * @param height - height of container
             */
            setup: function (oSVG, width, height) {
                this.nodeData = this.getValues();

                // Override settings
                this.settings = $.extend(true, {}, this.defaultSettings);
                $.extend(true, this.settings, this.chartSettings);
                if (this.getChartProperties()) {
                    $.extend(true, this.settings, this.getChartProperties());
                }
            },
            /**
             * Calls parent redraw function, clears previous SVG elements
             * @param oSVG
             * @param width
             * @param height
             */
            redraw: function (oSVG, width, height) {
            },
            createPopover: function () {
                this._oPopover = sap.ui.xmlfragment("sap.fiori.cri.view.D3ChartPopover", this);
                this.addDependent(this._oPopover);
                this._oPopover.setModel(new JSONModel());
            },
            /**
             * Formats the popover totals to si units, rounded to 0.1
             * @param value - Number to format
             * @param sNoDataValue - Displayed if data unavailable
             * @returns {*}
             */
            formatValue: function (value, sNoDataValue) {
                var iMaxDigits = 1;
                var sFormatStyle = "short";

                if (Math.abs(value) < 1) {
                    // Calculate number of decimal places required to show values less than 1
                    iMaxDigits = Math.ceil(Math.abs(Math.log10(Math.abs(value))));

                    // Show at most 3 decimal places
                    iMaxDigits = Math.min(iMaxDigits, 3);
                }

                if (Math.abs(value) < 1000) {
                    sFormatStyle = "medium";
                }

                var oNumberFormat = NumberFormat.getFloatInstance({
                    minFractionDigits: 0,
                    maxFractionDigits: iMaxDigits,
                    style:sFormatStyle
                });

                if (value || value == 0) {
                    return oNumberFormat.format(value);
                } else {
                    // Handle null or undefined values
                    return sNoDataValue || "N/A";
                }
            },
            /**
             * Handles scaling the axis domain
             * @param domain
             * @param tickTarget
             * @returns {Array}
             */
            alignDomainToTicks: function (domain, tickTarget) {
                var span = domain[1] - domain[0];
                var step = Math.pow(10, Math.floor(Math.log(span / tickTarget) / Math.LN10));
                var error = tickTarget / span * step;

                var rounding = 100;
                error = Math.round(error * rounding) / rounding;

                if (error <= 0.15){ 
                	step *= 10;
                }
                else if (error <= 0.35) {
                	step *= 5;
                }
                else if (error <= 0.75) {
                	step *= 2;
                }

                step = Math.max(step, 1);

                var aligned = [];

                aligned.push(Math.floor(domain[0] / step) * step);
                aligned.push(Math.ceil(domain[1] / step) * step);

                return aligned;
            },
            /**
             * Shows a "No data" centered on the SVG
             * @param oSVG
             * @param width
             */
            showNoData: function (oSVG, width){
                var heightOfText = 12;
                oSVG.append("text")
                    .attr("x", width / 2)
                    .attr("y", heightOfText)
                    .attr("font-size", heightOfText)
                    .attr("text-anchor", "middle")
                    .text("No data");
            },
            /**
             * Formats text to split by space delimitter
             * @param text
             * @param width
             */
            wrap: function (text, width) {
                text.each(function () {
                    var text = d3.select(this),
                        words = text.text().split(/\s+/).reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.1, // ems
                        y = text.attr("y"),
                        dy = parseFloat(text.attr("dy")),
                        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        if (tspan.node().getComputedTextLength() > width) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                        }
                    }
                });
            },
            /**
             * Returns the range of values for specified extent type
             * @param sExtent - name of extent
             * @returns {Array} - values for given extent
             */
            getExtent: function(sExtent) {
                var aExtents = [];
                this.nodeData.forEach(function (oNode) {
                    if (+oNode[sExtent]) {   // If string is number
                        aExtents.push(parseFloat(oNode[sExtent]));
                    } else {
                        aExtents.push(oNode[sExtent]);
                    }
                });
                return aExtents;
            }
        });
    }
);

