sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/thirdparty/d3",
    "sap/m/VBox",
    "sap/m/FlexAlignItems",
    "sap/m/FlexJustifyContent",
    "sap/m/FlexBox"
    ],
    /**
     * Event Overview Bubble Chart
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.ui.thirdparty.d3} d3 D3 Library
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @returns {*} Event Overview Bubblechart
     */
    function (Control, d3) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.EventOverviewBubbleChart", {
            metadata: {
                properties: {
                    "width": {type: "string", defaultValue:"100%"},
                    "height": {type: "string", defaultValue:"100%"}
                },
                aggregations: {
                    items: {type: "sap.fiori.cri.control.BubbleChartItem", multiple: true, singularName: "item"}
                },
                defaultAggregation: "items",
                events: {
                    select: {
                        parameters: {
                            item: {type: "sap.fiori.cri.control.BubbleChartItem"}
                        }
                    }
                }
            },
            init: function () {

            },
            createChart: function () {
                var oChartLayout = new sap.m.VBox({
                    alignItems: sap.m.FlexAlignItems.Center,
                    justifyContent: sap.m.FlexJustifyContent.Center
                });

                var height = this.getHeight() || "300px";
                var width = this.getWidth() || "300px";
                var oChartFlexBox = new sap.m.FlexBox({
                    height: height,
                    width: width,
                    alignItems: sap.m.FlexAlignItems.Center
                });

                this.sParentId = oChartFlexBox.getIdForLabel();
                oChartLayout.addItem(oChartFlexBox);

                return oChartLayout;
            },
            updateForceLayout: function (e) {
                var ke = e.alpha;

                var collide = function (node) {
                    var r = node.radius + 16,
                        nx1 = node.x - r,
                        nx2 = node.x + r,
                        ny1 = node.y - r,
                        ny2 = node.y + r;
                    return function (quad, x1, y1, x2, y2) {
                        if (quad.point && (quad.point !== node)) {
                            var x = node.x - quad.point.x,
                                y = node.y - quad.point.y,
                                l = Math.sqrt(x * x + y * y),
                                r = node.radius + quad.point.radius;
                            if (l < r) {
                                l = (l - r) / l * 0.5;
                                node.x -= x *= l;
                                node.y -= y *= l;
                                quad.point.x += x;
                                quad.point.y += y;
                            }
                        }
                        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                    };
                };

                var q = d3.geom.quadtree(this.nodeData),
                    i = 0,
                    n = this.nodeData.length;

                while (++i < n) {
                    q.visit(collide(this.nodeData[i]));
                }

                this.node.attr("transform", function (d) {
                    var desiredX = Math.max(this.horizontalPostioner(d.value), d.radius * 2);
                    if (Math.abs(d.x - desiredX) > 5) {
                        d.x -= (d.x - desiredX) * ke;
                    }

                    var desiredY = this.canvasHeight / 2;

                    if (Math.abs(d.y - desiredY) > 5) {
                        d.y -= (d.y - desiredY) * ke;
                    }
                    return "translate(" + d.x + " " + d.y + ")";
                }.bind(this));
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
                    oEntry.color = this.colorForInfluence(cItems[i].getProperty("intensity"));
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
                    this.rerender();
                }.bind(this);

                if (!this.resizeHandler) {
                    this.resizeHandler = sap.ui.core.ResizeHandler.register(this, onResizeEnd);
                }

                this.force = d3.layout.force()
                    .nodes(this.nodeData)
                    .gravity(0)
                    .size([this.canvasWidth, this.canvasHeight])
                    .on('tick', this.updateForceLayout.bind(this))
                    .start();

                var maxNodeValue = d3.max(this.nodeData, function (d) {
                    return d.value;
                }) + 0.001;

                var minNodeValue = d3.min(this.nodeData, function (d) {
                        return d.value;
                    });

                var padding = 0.2;
                var margin = 5;
                var maxFoci = padding * this.canvasWidth;
                var minFoci = (1 - padding) * this.canvasWidth;

                this.horizontalPostioner = d3.scale.linear().domain([maxNodeValue, minNodeValue]).range([maxFoci, minFoci]);

                var minNodeSize = 5;
                var maxNodeSize = Math.min(90, Math.min(maxFoci - margin, this.canvasWidth / 7 - margin));

                var nodeScaler = d3.scale.linear().domain([0, maxNodeValue]).range([minNodeSize, maxNodeSize]);

                this.node = this.d3SVG.selectAll(".node")
                    .data(this.nodeData)
                    .enter().append("g")
                    .attr("class", "node")
                    .on('click', function (d) {
                        this.fireEvent("select", {
                            item: d.boundData
                        });
                    }.bind(this));

                this.node.append("circle")
                    .attr("r", function (d) {
                        d.radius = nodeScaler(d.value);
                        return d.radius;
                    })
                    .style("fill", function (d) {
                        return d.color;
                    })
                    .style("stroke-width", "2px")
                    .style("stroke", function (d) {
                        return d3.rgb(d.color).darker(0.1);
                    })
                    .on('mouseover', function (d) {
                        d3.select(this).style("stroke", "#008bc7");
                    })
                    .on('mouseout', function (d) {
                        d3.select(this).style("stroke", function (d) {
                            return d3.rgb(d.color).darker(0.1);
                        });
                    })
                    .append("title")
                    .text(function (d) {
                        return d.name;
                    });

                var that = this;
                this.node.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("fill", "white")
                    .style("pointer-events", "none")
                    .style("font-size", "20px")
                    .text(function (d) {
                        return d.name;
                    })
                    .each(function (d) {
                        that.wrapText.apply(that, [this, d]);
                    });
            },
            wrapText: function (textNode, d) {
                var textD3 = d3.select(textNode);
                var words = d.name.split(/\s+/).reverse();
                var wordsWithSizes = [];

                var word = words.pop();
                while (word) {
                    textD3.text(word);
                    var size = textNode.getComputedTextLength();
                    wordsWithSizes.push({word: word, size: size});
                    word = words.pop();
                }

                textD3.text(" ");
                var widthOfSpace = textNode.getComputedTextLength();

                var initialLineCount = 1;
                var lineHeight = 1.1;

                var lines = this.buildLines(initialLineCount, wordsWithSizes, lineHeight, d.radius, widthOfSpace);
                if (lines == null || lines.length > 4) {
                    var fontSize = textD3.style("font-size");
                    var parsedFont = parseInt(/\d*/.exec(fontSize)[0], 10);

                    if (parsedFont < 5) {
                        textD3.text("");
                        return;
                    }
                    textD3.style("font-size", (parsedFont - 1) + "px");

                    this.wrapText(textNode, d);

                    return;
                }

                var startY = ((lines.length - 1) * -lineHeight / 2);
                textD3.text(null)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", startY + "em")
                    .text(
                        lines[0].map(function (d) {
                            return d.word;
                        }).join(" ")
                    );

                for (var i = 1; i < lines.length; i++) {
                    var line = lines[i];
                    textD3.append("tspan")
                        .attr("x", 0)
                        .attr("dy", lineHeight + "em")
                        .text(
                            line.map(function (d) {
                                return d.word;
                            }).join(" ")
                        );
                }
            },
            buildLines: function (desiredLineCount, wordsWithSizes, lineHeight, radius, widthOfSpace) {
                var pixelsPerEmDefault = 16;
                if (desiredLineCount * lineHeight > radius / pixelsPerEmDefault * 2) {
                    return null;
                }

                var y = ((desiredLineCount - 1) * -lineHeight / 2);
                var lineWidth = this.calculateWidthOfCircleAtY(y, radius);

                var lines = [];
                var currentLine = [];
                var lineSize = 0;

                for (var i = 0; i < wordsWithSizes.length; i++) {
                    var wordSize = wordsWithSizes[i];
                    lineSize += wordSize.size + widthOfSpace;
                    currentLine.push(wordSize);

                    if (lineSize > lineWidth) {

                        currentLine.pop();
                        lines.push(currentLine);

                        currentLine = [wordSize];

                        lineSize = wordSize.size + widthOfSpace;

                        y += lineHeight;
                        lineWidth = this.calculateWidthOfCircleAtY(y, radius);

                        if (lineSize > lineWidth) {
                            return null;
                        }
                    }
                }

                lines.push(currentLine);

                if (lines.length > desiredLineCount) {
                    return this.buildLines(desiredLineCount + 1, wordsWithSizes, lineHeight, radius, widthOfSpace);
                } else {
                    return lines;
                }
            },
            calculateWidthOfCircleAtY: function (y, radius) {
                var padding = 12;
                var x = Math.sqrt(radius * radius - y * y);
                return 2 * x - 2 * padding;
            },
            colorForInfluence: function (influence) {
                //Need config with serverside support
                var highInfThreshold = 15;
                var medInfThreshold = 7;
                var highInfColor = "#C70324";
                var medInfColor = "#E17B86";
                var lowInfColor = "#F4C8CC";
                if (influence > highInfThreshold) {
                    return highInfColor;
                } else if (influence > medInfThreshold) {
                    return medInfColor;
                } else {
                    return lowInfColor;
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
            }
        });
    }
);