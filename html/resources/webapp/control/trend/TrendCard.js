sap.ui.define([
        "sap/fiori/cri/control/BaseControl",
        "sap/ui/model/json/JSONModel",
        "sap/fiori/cri/control/trend/TrendCardConstants",
        "sap/viz/ui5/data/DimensionDefinition",
        "sap/viz/ui5/data/MeasureDefinition",
        "sap/viz/ui5/controls/common/feeds/FeedItem",
        "sap/fiori/cri/control/HorizontalBar"
    ],
    /**
     * Trend Card
     * @param {sap.fiori.cri.control.BaseControl} BaseControl Base Control
     * @param {sap.ui.model.json.JSONModel} JSONModel JSON Model
     * @param {sap.fiori.cri.control.trend.TrendCardConstants} TrendCardConstants Helper constants for trend cards
     * @param {sap.viz.ui5.data.DimensionDefinition} DimensionDefinition DimensionDefinition for viz frame
     * @param {sap.viz.ui5.data.MeasureDefinition} MeasureDefinition MeasureDefinition for viz frame
     * @param {sap.viz.ui5.controls.common.feeds.FeedItem} FeedItem FeedItem for viz frame
     * @param {sap.fiori.cri.control.HorizontalBar} HorizontalBar Horizontal bar control
     * @returns {*} Trend Card
     */
    function (BaseControl, JSONModel, TrendCardConstants, DimensionDefinition, MeasureDefinition, FeedItem, HorizontalBar) {
        'use strict';
        return BaseControl.extend("sap.fiori.cri.control.trend.TrendCard", {
            metadata: {
                properties: {},
                aggregations: {
                    title: {type:"sap.fiori.cri.control.trend.TrendCardTitle"}
                },
                events: {}
            },
            _cardHeight:600,
            _titleHeight:45,
            _headerHeight:45,
            _footerHeight:40,
            _headerPadding:32,
            _chartToolbarHeight:48,
            renderer: {
                render: sap.fiori.cri.control.BaseControl.prototype.render
            },
            init: function () {
                this.setModel(new JSONModel());

                // Calculate content and chart heights
                this._contentHeight = this._cardHeight - this._titleHeight - this._headerPadding;
                this._chartHeight = (this._contentHeight - this._chartToolbarHeight - this._headerHeight);

                this.setModel(new JSONModel({
                    contentHeight: this._contentHeight + 'px',
                    chartHeight: this._chartHeight + 'px'
                }), "viewModel");

                // Setup formatter for chart labels
                var chartFormatter = sap.viz.ui5.format.ChartFormatter.getInstance();
                chartFormatter.registerCustomFormatter(TrendCardConstants.FORMAT_NAME.CRIShort, function (value) {
                    return TrendCardConstants.formatValue(value, 2);
                });
                sap.viz.ui5.api.env.Format.numericFormatter(chartFormatter);
            },
            setCardData: function (oCardData) {
                if (oCardData.content && oCardData.content.chart) {
                    var vizProperties = this.getDefaultVizProperties();

                    if (oCardData.content.chart.vizProperties) {
                        $.extend(true, vizProperties, oCardData.content.chart.vizProperties);
                    }

                    oCardData.content.chart.vizProperties = vizProperties;
                }

                this.getModel().setData(oCardData);

                var iHeaderHeight = (oCardData.header && oCardData.header.kpi ? this._headerHeight : 0);
                var iFooterHeight = (oCardData.footer && oCardData.footer.actions.length > 0 ? this._footerHeight : 0);

                var sContentHeight = this._contentHeight - iHeaderHeight - iFooterHeight + 'px';
                var sChartHeight = this._chartHeight - iFooterHeight + 'px';

                var oViewModel = this.getModel("viewModel");
                oViewModel.setProperty("/contentHeight", sContentHeight);
                oViewModel.setProperty("/chartHeight", sChartHeight);

                this.rerender();
            },
            getCardData: function () {
                var oModel = this.getModel();
                return oModel && oModel.getData();
            },
            createContent: function () {
                if (!this.oContent) {
                    this.oContent = this.oContent || new sap.ui.xmlfragment("sap.fiori.cri.view.TrendCard", this);
                    var oCardData = this.getModel();

                    this.oContent.setModel(oCardData);
                    this.oContent.setModel(this.getModel("viewModel"), "viewModel");
                }

                return this.oContent;
            },

            // Header Helpers
            formatDeltaValue: function (value, maxDigits) {
                return (value > 0 ? "+" : "") + TrendCardConstants.formatValue(value);
            },

            // Chart Helpers
            feedItemFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                return new FeedItem(mSettings);
            },
            dimensionFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                return new DimensionDefinition(mSettings);
            },
            measureFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                return new MeasureDefinition(mSettings);
            },
            columnFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                return new sap.m.Column(mSettings);
            },
            tableItemFactory: function (sId, oContext) {
                var listItem = new sap.m.ColumnListItem();

                var oData = oContext.oModel.getProperty(oContext.sPath);

                listItem.addCell(new sap.m.Text({text:oData.CATEGORY}));

                if (oData.FILTERED || oData.FILTERED === 0){
                    listItem.addCell(new sap.m.Text({text:TrendCardConstants.formatValue(oData.FILTERED, 2)}));

                    if (oData.FILTERED2 || oData.FILTERED2 === 0) {
                        listItem.addCell(new sap.m.Text({text:TrendCardConstants.formatValue(oData.FILTERED2, 2)}));
                    }
                }
                listItem.addCell(new sap.m.Text({text:TrendCardConstants.formatValue(oData.TOTAL, 2)}));

                if (oData.TOTAL2 || oData.TOTAL2 === 0) {
                    listItem.addCell(new sap.m.Text({text: TrendCardConstants.formatValue(oData.TOTAL2, 2)}));
                }

                return listItem;
            },
            getDefaultVizProperties:function () {
                return {
                    general: {
                        layout: {
                            paddingTop: 40
                        }
                    },
                    title: {
                        visible: false
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    valueAxis: {
                        title: {
                            visible: false
                        },
                        label: {
                            visible: true,
                            formatString: TrendCardConstants.FORMAT_NAME.CRIShort
                        }
                    },
                    valueAxis2: {
                        title: {
                            visible: false
                        },
                        label: {
                            visible: true,
                            formatString: TrendCardConstants.FORMAT_NAME.CRIShort
                        }
                    },
                    timeAxis: {
                        title: {
                            visible: false
                        },
                        interval: {
                            unit: "auto"
                        }
                    },
                    plotArea: {
                        isFixedDataPointSize: false,
                        window: {
                            start: null,
                            end: null
                        },
                        adjustScale: true,
                        colorPalette :  [TrendCardConstants.COLOR.qualitative.blue, TrendCardConstants.COLOR.qualitative.gold],
                        primaryValuesColorPalette :  [TrendCardConstants.COLOR.qualitative.blue, TrendCardConstants.COLOR.semantic.negative],
                        secondaryValuesColorPalette :  [TrendCardConstants.COLOR.qualitative.gold, TrendCardConstants.COLOR.semantic.negativeLight]
                    },
                    interaction: {
                        behaviorType: null,
                        selectability: {
                            legendSelection:true,
                            plotLassoSelection:false,
                            mode: "EXCLUSIVE"
                        }
                    },
                    tooltip:{
                        visible:true,
                        formatString:TrendCardConstants.FORMAT_NAME.CRIShort
                    }
                };
            },
            getIconForChartType:function (sChartType) {
                switch (sChartType) {
                    case "column":
                    case "timeseries_column":
                    case "stacked_column":
                        return "sap-icon://bar-chart";
                    case "line":
                    case "timeseries_line":
                    default:
                        return "sap-icon://line-chart";
                }
            },
            // List Helpers
            listColumnFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                mSettings.vAlign = "Bottom";
                if(mSettings.hAlign){
                	mSettings.width ="30%";
                } else {
                	mSettings.width ="70%";
                }
                return new sap.m.Column(mSettings);
            },
            listItemFactory: function (sId, oContext) {
                var listItem = new sap.m.ColumnListItem();
                listItem.addStyleClass("listItem");

                var oData = oContext.oModel.getProperty(oContext.sPath);

                var value = Number(oData.TOTAL) || 0;

                var vBox1 = new sap.m.VBox({ alignItems:"Start",width:"100%"});
                vBox1.addStyleClass("sapUiTinyMarginTop sapUiNoMarginBottom");

                var categoryText = new sap.m.Text({text:oData.CATEGORY});
                categoryText.addStyleClass("sapThemeDarkText");

                vBox1.addItem(categoryText);

                var vBox2 = new sap.m.VBox({width:"100%"});
                vBox2.addStyleClass("sapUiNoContentPadding sapUiSmallMarginBottom sapUiSmallMarginTop");

                var hBar = new HorizontalBar({
                    showValueLabel:false,
                    padding:0,
                    height:"6px",
                    label:"",
                    color:TrendCardConstants.COLOR.qualitative.blue,
                    value:value,
                    maxValue:oData.MAX_VALUE || value
                });

                hBar.addStyleClass("sapUiTinyMarginBottom");

                var filtered = Number(oData.FILTERED) || 0;

                if (oData.FILTERED || oData.FILTERED === 0) {
                    var hBar2 = new HorizontalBar({
                        showValueLabel: false,
                        padding: 0,
                        height: "6px",
                        label: "",
                        color: TrendCardConstants.COLOR.qualitative.gold,
                        value: filtered,
                        maxValue: oData.MAX_FILTERED || filtered
                    });

                    hBar2.addStyleClass("sapUiTinyMarginBottom");

                    vBox2.addItem(hBar2);
                } else {
                    vBox2.addItem(hBar);
                }

                vBox1.addItem(vBox2);

                listItem.addCell(vBox1);

                if (oData.FILTERED || oData.FILTERED === 0) {
                    listItem.addCell(this.buildListItemValue(oData.FILTERED));
                } else {
                    listItem.addCell(this.buildListItemValue(value));
                }

                return listItem;
            },
            buildListItemValue: function (value) {
                var formattedValue = TrendCardConstants.formatValue(value, 2);

                var hasMeasure = value > 1000;
                var sNumberPart = hasMeasure ? formattedValue.slice(0, -1) : formattedValue;
                var sMeasurePart = hasMeasure ? formattedValue.slice(-1) : "";

                var text = new sap.m.Text({
                    text:sNumberPart
                }).addStyleClass("value " + TrendCardConstants.STYLE.kpiValueNegative);

                var measure = new sap.m.Text({
                    text:sMeasurePart
                }).addStyleClass("measure " + TrendCardConstants.STYLE.kpiValueNegative);

                var hBox = new sap.m.HBox({
                    justifyContent: sap.m.FlexJustifyContent.End,
                    alignItems:sap.m.FlexAlignItems.Baseline,
                    items:[text, measure]
                }).addStyleClass("sapUiTinyMarginBottom");

                return hBox;
            },

            // Footer helpers
            actionItemFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);
                return new sap.m.Button({
                    text: mSettings.label,
                    type:"Transparent",
                    press:function (oEvent) {
                        var xAppNavService = sap.ushell
                            && sap.ushell.Container
                            && sap.ushell.Container.getService
                            && sap.ushell.Container.getService("CrossApplicationNavigation");

                        var href = (xAppNavService && xAppNavService.hrefForExternal({
                                target : { semanticObject : mSettings.semanticObject, action : mSettings.action }
                            })) || "";

                        xAppNavService.toExternal({ target: { shellHash: href } });
                    }
                });
            }

        });
    }
);