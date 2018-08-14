sap.ui.define([
        "sap/fiori/cri/control/BaseChart",
        "sap/ui/thirdparty/d3",
        "sap/ui/model/json/JSONModel"
    ],
    function (BaseChart, d3, JSONModel) {
        'use strict';
        return BaseChart.extend("sap.fiori.cri.control.charts.DonutChart", {
            constructor: function () {
                BaseChart.apply(this, arguments);
                this.chartSettings = {
                    plotArea: {
                        colorPalette: ["#BB0000", "#E78C07", "#49AAE2"],
                        donutInnerScale: 0.4,
                        donutOuterScale: 0.35
                    },
                    label: ""
                };
            },
            renderer: {},
            setup: function (oSVG, width, height) {
                if (BaseChart.prototype.setup) {
                    BaseChart.prototype.setup.apply(this, arguments);
                }

                this.chartData = this.nodeData;
            },
            redraw: function (oSVG, width, height) {
                if (BaseChart.prototype.redraw) {
                    BaseChart.prototype.redraw.apply(this, arguments);
                }

                oSVG.selectAll("svg > *").remove();

                if (!this.chartData){
                    this.showNoData(oSVG, width);
                    return;
                }

                this.drawPlotArea(oSVG, width, height);
            },
            /**
             *
             * Draws elements on the SVG canvas
             * @param oSVG - SVG canvas
             * @param iWidth - container width
             * @param iHeight - container height
             */
            drawPlotArea: function (oSVG, iWidth, iHeight) {
                var that = this;
                // Calculate plot width
                var iPlotWidth = iWidth - this.settings.margin.left - this.settings.margin.right;
                var iPlotHeight = iHeight - this.settings.margin.top - this.settings.margin.bottom;

                var aColors = this.settings.plotArea.colorPalette;

                var fOuterRadius = Math.min(iPlotWidth, iPlotHeight) * this.settings.plotArea.donutInnerScale;

                var chartBaseNode = oSVG.append('g').attr('class', 'root').attr("transform", "translate(" + (iWidth / 2) + "," + (iHeight / 2) + ")");

                var arcGenerator = d3.svg.arc()
                    .outerRadius(fOuterRadius)
                    .innerRadius(fOuterRadius * this.settings.plotArea.donutOuterScale);

                var piefier = d3.layout.pie()
                    .value(function (d) {
                        return parseInt(d.value, 10) || 0;
                    });

                var pieChunkNodes = chartBaseNode.selectAll('g.piechunk')
                    .data(piefier(this.chartData))
                    .enter()
                    .append("g").attr("class", "piechunk");

                pieChunkNodes.append("path")
                    .attr("d", arcGenerator)
                    .attr("fill", function (d, i) {
                        return aColors[i % aColors.length];
                    })
                    .attr("stroke", "white")
                    .attr("stroke-width", "1px")
                    .on("mouseover", function (d, i){
                        that.createPopover();
                        that._oPopover.getModel().setProperty("/showLabel", false);
                        that._oPopover.getModel().setProperty("/values", that.getPopoverData(d, i));
                        that._oPopover.openBy(this);
                    })
                    .on("mouseout", function (d) {
                        that._oPopover.destroy();
                    });

                var iWidthOf100PercentTextAt12px = 41; //#not being able to calculate text widths ahead of time in 2017

                arcGenerator.innerRadius(fOuterRadius)
                    .outerRadius(fOuterRadius + iWidthOf100PercentTextAt12px);


                var iSumValues = this.chartData.reduce(function (sum, d) {
                    return sum + parseInt(d.value, 10) || 0;
                }, 0);

                pieChunkNodes.append("text")
                    .attr("transform", function (d) {
                        return "translate(" + arcGenerator.centroid(d) + ")";
                    })
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "12px")
                    .text(function (d) {
                        return (d.value / iSumValues * 100).toFixed(1) + '%';
                    });
                this.drawLegend(oSVG, iPlotHeight, iPlotWidth);
            },
            /**
             * Filters data for matching X axis labels, populates popover data
             * @param label
             * @returns {Array} - popover formatted values
             */
            getPopoverData: function (label, i) {
                var aColors = this.settings.plotArea.colorPalette;
                var that = this;
                var popoverData = [];
                var height = 9;
                var width = 11;
                var squareLength = 9;
                popoverData.push({
                    name: label.data.name,
                    HTML: "<svg height=" + '"' + height + 'px" ' +   "width=" + '"' + width + 'px">' +
                    '<rect height="' + squareLength + '" width ="' + squareLength + '" fill="' + aColors[i % aColors.length] + '"></rect> ' +
                    '</svg>',
                    value: that.formatValue(label.value)
                });

                return popoverData;
            },
            /**
             * Appends legend to SVG
             * @param oSVG
             * @param height - height of SVG
             * @param width - width of SVG
             */
            drawLegend: function (oSVG, plotHeight, plotWidth) {
                var iHeightOfText = 12;
                var legendColorXOffset = -1.5;
                var legendColorYOffset = -0.5;
                var legendNode = oSVG.append("g").attr("class", "legend")
                    .attr("transform", "translate(" + this.settings.margin.left + "," + (plotHeight - iHeightOfText) + ")");

                var legendItems = legendNode.selectAll(".item")
                    .data(this.chartData)
                    .enter()
                    .append("g")
                    .attr("class", "item");

                var aColors = this.settings.plotArea.colorPalette;

                legendItems.append("rect")
                    .attr("x", iHeightOfText * legendColorXOffset)
                    .attr("y", iHeightOfText * legendColorYOffset)
                    .attr("width", iHeightOfText)
                    .attr("height", iHeightOfText)
                    .attr("fill", function (d, i) {
                        return aColors[i % aColors.length];
                    });

                legendItems.append("text")
                    .attr("font-size", iHeightOfText + "px")
                    .attr("dominant-baseline", "middle")
                    .text(function (d) {
                        return d.name;
                    });

                legendNode.append("text")
                    .attr("font-size", iHeightOfText + "px")
                    .attr("dominant-baseline", "middle")
                    .attr("y", iHeightOfText * -1.5)
                    .attr("x", iHeightOfText * -1.5)
                    .text(this.settings.label);


                var legendPadding = iHeightOfText;
                var totalPadding = 0;
                var previousSibling;
                var yPadding = 0;
                legendItems.each(function (d, i) {
                    previousSibling = this.previousSibling;
                    if (previousSibling){
                        totalPadding += previousSibling.getBBox().width + legendPadding;
                    }
                    if (totalPadding + this.getBBox().width > plotWidth){
                        totalPadding = 0;
                        yPadding += 20;
                    }
                    d3.select(this).attr("transform", "translate(" + totalPadding + "," + yPadding + ")");
                });
            }
        });
    }
);

