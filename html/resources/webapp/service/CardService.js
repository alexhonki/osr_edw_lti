sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/control/trend/TrendCardConstants",
    "sap/ui/thirdparty/d3",
    "sap/fiori/cri/service/FilterService"
], function (JSONModel, TrendCardConstants, d3, FilterService) {
    "use strict";
    return {
        _defaultCardConfigPath:"sap/fiori/cri/trendAnalysis/trendCardConfig.json",
        getCardConfigurations: function (fnCompletion) {
            if (this.oCardConfigs) {
                // Already loaded configs so just return them
                fnCompletion(this.oCardConfigs);
                return;
            }

            var sCardConfigPath = jQuery.sap.getResourcePath(this._defaultCardConfigPath);
            this.loadCardConfigurations(sCardConfigPath, function (oCardConfigs) {
                this.oCardConfigs = oCardConfigs;
                fnCompletion(oCardConfigs);
            }.bind(this));
        },
        loadCardConfigurations:function (sPath, fnCompletion) {
            var oCardConfigModel = new JSONModel();
            oCardConfigModel.attachRequestCompleted(function (oEvent) {
                var oData = oEvent.getSource().getData();
                fnCompletion(oData.Cards);
            });
            oCardConfigModel.loadData(sPath);
        },
        buildCardData: function (oCardConfig, oLabelsModel) {
            return {
                title: this.getTitle(oCardConfig, oLabelsModel),
                subtitle: this.getSubtitle(oCardConfig, oLabelsModel),
                header: this.buildHeader(oCardConfig, oLabelsModel),
                content: this.buildContent(oCardConfig, oLabelsModel),
                footer: this.buildFooter(oCardConfig, oLabelsModel),
                loading: true
            };
        },
        getTitle:function (oCardConfig, oLabelsModel) {
            return oLabelsModel && oLabelsModel.getProperty("/TrendCardTitle" + oCardConfig.id)
                || oCardConfig.title
                || "";
        },
        getSubtitle: function (oCardConfig, oLabelsModel) {
            return oLabelsModel && oLabelsModel.getProperty("/TrendCardSubtitle" + oCardConfig.id)
                || oCardConfig.subtitle && oCardConfig.subtitle.string
                || "";
        },
        buildHeader: function (oCardConfig, oLabelsModel) {
            return oCardConfig.kpi && {
                    kpi:this.buildKPIData(oCardConfig, oLabelsModel),
                    comparison:this.buildComparisonData(oCardConfig, oLabelsModel)
            };
        },
        buildContent: function (oCardConfig, oLabelsModel) {
            return oCardConfig.chart && { chart: this.buildChartMetadata(oCardConfig.chart) }
            || oCardConfig.list && { list: this.buildListData(oCardConfig, oLabelsModel) };
        },
        buildFooter: function (oCardConfig, oLabelsModel) {
            return oCardConfig.actions && { actions:this.buildActions(oCardConfig, oLabelsModel) };
        },
        buildActions:function (oCardConfig, oLabelsModel) {
            return oCardConfig.actions;
        },
        buildKPIData:function (oCardConfig, oLabelsModel) {
            return oCardConfig.kpi && { unit: oCardConfig.kpi.unit };
        },
        buildComparisonData:function (oCardConfig, oLabelsModel) {
            return oCardConfig.comparison && { label: this.getComparisonLabel(oCardConfig, oLabelsModel) };
        },
        getComparisonLabel: function (oCardConfig, oLabelsModel) {
            return oLabelsModel && oLabelsModel.getProperty("/TrendCardTrendCardComparisonLabel")
                || oCardConfig.comparison && (oCardConfig.comparison.label || "MoM")
                || "";
        },
        buildChartMetadata:function (oChartConfig, isFiltered) {
            var measures = this.getMeasures(oChartConfig, isFiltered);
            var dimensions = this.getDimensions(oChartConfig, isFiltered);
            return {
                type: oChartConfig.type,
                vizProperties: this.getVizProperties(oChartConfig, isFiltered),
                feeds: this.getFeedItems(oChartConfig, measures, dimensions),
                measures: measures,
                dimensions: dimensions,
                columns: this.getColumns(oChartConfig, isFiltered)
            };
        },
        buildListData:function (oCardConfig) {
             return oCardConfig.list && {
                 columns:this.getColumns(oCardConfig.list)
            };
        },
        getVizProperties: function (oChartConfig, isFiltered) {
            var oTooltipFormatString = {
                Category:oChartConfig.categoryPathDisplayFormat || oChartConfig.timePathDisplayFormat || "MMM yyyy"
            };

            this.getMeasures(oChartConfig).forEach(function(oMeasure) {
                oTooltipFormatString[oMeasure.name] = TrendCardConstants.FORMAT_NAME.CRIShort;
            });

            if(oChartConfig.type == "donut") {
                if(isFiltered) {
                    oChartConfig.vizProperties.plotArea.colorPalette = TrendCardConstants.COLOR.donut.secondary;
                }
                else {
                    oChartConfig.vizProperties.plotArea.colorPalette = TrendCardConstants.COLOR.donut.primary;
                }
            }

            var oVizProperties = {
                tooltip:{
                    formatString:oTooltipFormatString
                }
            };

            if (oChartConfig.vizProperties) {
                $.extend(true, oVizProperties, oChartConfig.vizProperties);
            }

            return oVizProperties;
        },
        getFeedItems: function (oChartConfig, aMeasures, aDimensions) {
            var sChartType = oChartConfig.type;
            var oValueAxis = {
                uid:"valueAxis",
                type:"Measure",
                values:[]
            };
            var oCategoryAxis = {
                uid: "categoryAxis",
                type:"Dimension",
                values:[]
            };

            // Change values based on chart
            switch(sChartType) {
                case "timeseries_line":
                    oCategoryAxis.uid = "timeAxis";
                    break;
                case "donut":
                    oValueAxis.uid = "size";
                    oCategoryAxis.uid = "color";
            }

            aMeasures.forEach(function (oMeasure) {
                oValueAxis.values.push(oMeasure.name);
            });

            aDimensions.forEach(function (oDimension) {
                oCategoryAxis.values.push(oDimension.name);
            });

            return [ oValueAxis, oCategoryAxis ];
        },
        getMeasures: function (oChartConfig, isFiltered) {
            //TrendCardTotalCustomersChartSeriesLabelTotal
            var valueLabel = oChartConfig.valueLabel;

            var totalSeriesLabel = valueLabel || "Total";
            var filteredSeriesLabel = valueLabel ? valueLabel + "- Filtered" : "Filtered";

            var value2Label = oChartConfig.value2Label;
            var total2SeriesLabel = value2Label || "Total2";
            var filtered2SeriesLabel = value2Label ? value2Label + " - Filtered" : "Filtered2";

            var aMeasures = [{
                name: totalSeriesLabel,
                value:"{TOTAL}"
            }];

            if(oChartConfig.type == "donut" && isFiltered) {
                aMeasures = [];
            }

            if (value2Label) {
                aMeasures.push({
                    name: total2SeriesLabel,
                    value:"{TOTAL2}"
                });

                if (isFiltered) {
                    aMeasures.push({
                        name: filteredSeriesLabel,
                        value:"{FILTERED}"
                    });

                    aMeasures.push({
                        name: filtered2SeriesLabel,
                        value: "{FILTERED2}"
                    });
                }
            } else if (isFiltered) {
                aMeasures.push({
                    name: filteredSeriesLabel,
                    value:"{FILTERED}"
                });
            }

            return aMeasures;
        },
        getDimensions: function (oChartConfig, isFiltered) {
            var oDimension = {
                name:"Category",
                value:"{CATEGORY}"
            };

            if(oChartConfig.type == "donut" && isFiltered) {
                oDimension.value = "{CATEGORY} - Filtered";
            }

            if (oChartConfig.type.indexOf("timeseries") != -1) {
                oDimension.value = "{DATE}";
                oDimension.dataType = "date";
            }

            return [oDimension];
        },
        getColumns: function (oTableConfig, isFiltered) {
            var categoryLabel = oTableConfig.categoryLabel || oTableConfig.timeLabel || "Category";
            var valueLabel = oTableConfig.valueLabel;
            var value2Label = oTableConfig.value2Label;

            var oColumns = [
                {
                    header: new sap.m.Text({text: categoryLabel})
                }
            ];

            if (isFiltered) {
                oColumns.push({
                    hAlign: "End",
                    header: new sap.m.Text({text: valueLabel ? "Filtered (" + valueLabel + ")" : "Filtered"})
                });

                if (oTableConfig.value2Path) {
                    oColumns.push({
                        hAlign: "End",
                        header: new sap.m.Text({text: value2Label ? "Filtered (" + value2Label + ")" : "Filtered2"})
                    });
                }
            }

            oColumns.push({
                hAlign: "End",
                header: new sap.m.Text({text: valueLabel || "Total"})
            });

            if (oTableConfig.value2Path) {
                oColumns.push({
                    hAlign: "End",
                    header: new sap.m.Text({text: value2Label || "Total2"})
                });
            }

            return oColumns;
        },
        buildSelectParameters: function (oCardConfig) {
            var aSelectParams = [];

            var oDataConfig = oCardConfig.chart || oCardConfig.list;

            if (oDataConfig) {

                aSelectParams.push(oDataConfig.valuePath);

                if (oDataConfig.categoryPath && aSelectParams.indexOf(oDataConfig.categoryPath) == -1) {
                    aSelectParams.push(oDataConfig.categoryPath);
                }

                if (oDataConfig.timePath && aSelectParams.indexOf(oDataConfig.timePath) == -1) {
                    aSelectParams.push(oDataConfig.timePath);
                }

                if (oDataConfig.value2Path) {
                    aSelectParams.push(oDataConfig.value2Path);
                }
            }

            if (oCardConfig.subtitle.path && aSelectParams.indexOf(oCardConfig.subtitle.path) == -1) {
                aSelectParams.push(oCardConfig.subtitle.path);
            }

            if (oCardConfig.kpi) {

                if (oCardConfig.kpi.valuePath && aSelectParams.indexOf(oCardConfig.kpi.valuePath) == -1) {
                    aSelectParams.push(oCardConfig.kpi.valuePath);
                }

                if (oCardConfig.kpi.unitPath) {
                    aSelectParams.push(oCardConfig.kpi.unitPath);
                }
            }

            return aSelectParams;
        },
        buildSorters: function (oCardConfig, aSelectParams) {
            var aSorters = null;

            if (oCardConfig.sorters) {
                aSorters = [];
                oCardConfig.sorters.forEach(function (mSorterConfig) {
                    var path = mSorterConfig.path; //"TIME_SEGMENT";
                    var descending = mSorterConfig.descending;
                    aSorters.push(new sap.ui.model.Sorter(path, descending));

                    if (aSelectParams.indexOf(path) == -1) {
                        aSelectParams.push(path);
                    }
                });
            }
            return aSorters;
        },
        buildFilters: function (oCardConfig) {
            var aFilters = null;
            if (oCardConfig.filters) {
                aFilters = [];

                oCardConfig.filters.forEach(function (mFilterConfig) {
                    var path = mFilterConfig.path;
                    var operator = sap.ui.model.FilterOperator.EQ;
                    var value = mFilterConfig.value;

                    aFilters.push(new sap.ui.model.Filter({
                        path:path,
                        operator:operator,
                        value1:value
                    }));
                });
                aFilters = [new sap.ui.model.Filter({filters:aFilters, and:true})];
            }
            return aFilters;
        },
        getTotalDataForCard: function (sCardId, sDateFilterString) {
            return this._totalDataById
                && this._totalDataById[sCardId]
                && this._totalDataById[sCardId][sDateFilterString];
        },
        setTotalDataForCard: function (sCardId, sDateFilterString, oData) {
            if (!this._totalDataById){
                this._totalDataById = {};
            }

            if (!this._totalDataById[sCardId]){
                this._totalDataById[sCardId] = {};
            }

            this._totalDataById[sCardId][sDateFilterString] = oData;
        },
        getNoData: function (oCardConfig, oCardData, isFiltered) {
            var kpiValue = null;
            if (oCardData.header.kpi) {
                oCardData.header.kpi.value = kpiValue;
                oCardData.header.kpi.formattedValue = TrendCardConstants.formatValue(kpiValue);
                oCardData.header.kpi.style = TrendCardConstants.STYLE.kpiValueNeutral;
            }

            var delta = kpiValue;
            if (oCardData.header.comparison) {
                oCardData.header.comparison.value = delta;
                oCardData.header.comparison.formattedValue = TrendCardConstants.formatValue(delta);
            }

            oCardData.loading = false;

            var oChartData = [];

            if (oCardConfig.chart) {
                oCardData.content.chart = this.buildChartMetadata(oCardConfig.chart, isFiltered);
                oCardData.content.chart.data = oChartData;
            } else if (oCardConfig.list) {
                oCardData.content.list.data = oChartData;
                oCardData.content.list.columns = this.getColumns(oCardConfig.list);
            }
            return oCardData;
        },
        loadData:function (oCardConfig, oModel, fnSuccess, fnError) {
            var sCardId = oCardConfig.id;

            // Prepare for data load
            var sEntity = oCardConfig.entity || "TrendParameters";

            // Configure input parameters
            var sDateFilterString = FilterService.getDateFilterString();

            var sFilters = FilterService.getEncodedFilterString();
            var isFiltered = sFilters != "";

            var sInputParameters = sDateFilterString + ",IP_FILTER=''";
            var sInputParametersFiltered = sDateFilterString + ",IP_FILTER='" + sFilters + "'";

            if (oCardConfig.inputParameters) {
                if (oCardConfig.inputParameters.indexOf("IP_FILTER") != -1) {
                    sInputParameters = "IP_FILTER=''";
                    sInputParametersFiltered = "IP_FILTER='" + sFilters + "'";
                }
            }

            var aSelectParams = this.buildSelectParameters(oCardConfig);
            var aSorters = this.buildSorters(oCardConfig, aSelectParams);
            var aFilters = this.buildFilters(oCardConfig);

            var mURLParams = {
                $select: aSelectParams
            };

            if (oCardConfig.top) {
                mURLParams.$top = oCardConfig.top;
            }

            // Load data
            var oTotalDeferred = $.Deferred();
            var oFilteredDeferred = $.Deferred();

            var aTotalData = this.getTotalDataForCard(sCardId, sDateFilterString) || [];
            var aFilteredData = [];

            //oModel.setUseBatch(false);
            if (aTotalData.length == 0) {
                oModel.read("/" + sEntity + "(" + sInputParameters + ")/Results", {
                    sorters: aSorters,
                    filters: aFilters,
                    urlParameters: mURLParams,
                    success: $.proxy(function (oResults) {
                        aTotalData = oResults.results;
                        this.setTotalDataForCard(sCardId, sDateFilterString, aTotalData);
                        oTotalDeferred.resolve();
                    }.bind(this), this),
                    error: $.proxy(function () {
                        aTotalData = [];
                        this.setTotalDataForCard(sCardId, sDateFilterString, aTotalData);
                        oTotalDeferred.reject();
                    }.bind(this), this)
                });
            } else {
                oTotalDeferred.resolve();
            }

            if (isFiltered) {
                oModel.read("/" + sEntity + "(" + sInputParametersFiltered + ")/Results", {
                    sorters: aSorters,
                    filters: aFilters,
                    urlParameters: mURLParams,
                    success: $.proxy(function (oResults) {
                        aFilteredData = oResults.results;
                        oFilteredDeferred.resolve();
                    }, this),
                    error: $.proxy(function () {
                        oFilteredDeferred.reject();
                    }, this)
                });
            }

            var oWhen = isFiltered ? $.when(oTotalDeferred, oFilteredDeferred) : $.when(oTotalDeferred);

            oWhen.fail($.proxy(function () {
                fnError();
            }));
            oWhen.done($.proxy(function () {
                if (isFiltered) {
                    fnSuccess(aTotalData, aFilteredData);
                } else {
                    fnSuccess(aTotalData);
                }
            }));
        },
        updateCardData:function (oCardConfig, oCardData, oModel, fnCallback) {

            this.loadData(oCardConfig, oModel,
                function (aTotalData, aFilteredData) {
                    // Success

                    var isFiltered = !!aFilteredData;

                    // Setup formatters
                    var oDataConfig = oCardConfig.chart || oCardConfig.list;

                    var sFormatString = oDataConfig.timePathDateFormat || oDataConfig.categoryPathDateFormat;
                    var sDisplayString = oDataConfig.timePathDisplayFormat || oDataConfig.categoryPathDisplayFormat;

                    var oDateFormat;
                    var oDisplayFormat;

                    if (sFormatString) {
                        oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: sFormatString});
                    }
                    if (sDisplayString) {
                        oDisplayFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: sDisplayString});
                    }

                    // Choose data set based on filtered status
                    var oDataSet = (isFiltered ? aFilteredData : aTotalData);

                    var sValuePath = oDataConfig.valuePath;
                    var sValue2Path = oDataConfig.value2Path;

                    var maxValue = aTotalData && d3.max(aTotalData, function (oData) { return oData[sValuePath]; }) || null;
                    var maxFiltered = isFiltered && aFilteredData && d3.max(aFilteredData, function (oData) { return oData[sValuePath]; }) || null;

                    // Parse loaded data into required format for chart
                    var oChartData = [];
                    for (var i = 0; i < aTotalData.length; i++) {
                        var oTotalData = aTotalData[i];
                        var oFilteredData = isFiltered && aFilteredData && aFilteredData[i];
                        var oCurrentData = oDataSet[i];

                        var sCategoryPath = oDataConfig.categoryPath;
                        var sTimePath = oDataConfig.timePath;

                        var category = sCategoryPath && oCurrentData && oCurrentData[sCategoryPath];
                        var date = sTimePath && oTotalData[sTimePath] || null;

                        if (sTimePath && date) {
                            if (oDateFormat) {
                                date = oDateFormat.parse(date);
                            }
                            if (oDisplayFormat) {
                                category = oDisplayFormat.format(date);
                            }
                        } else {
                            if (oDateFormat) {
                                date = oDateFormat.parse(category);
                            }
                            if (oDisplayFormat && date) {
                                category = oDisplayFormat.format(date);
                            }
                        }

                        var oFilteredValue = oFilteredData && oFilteredData[sValuePath];
                        if (isFiltered && !oFilteredValue) {
                            oFilteredValue = " ";
                        }

                        var oFilteredValue2 = oFilteredData && oFilteredData[sValue2Path];
                        if (sValue2Path && isFiltered && !oFilteredValue2) {
                            oFilteredValue2 = " ";
                        }

                        oChartData.push({
                            CATEGORY: category,
                            DATE: date,
                            TOTAL: oTotalData[sValuePath],
                            MAX_VALUE: maxValue,
                            FILTERED: oFilteredValue,
                            MAX_FILTERED: maxFiltered,
                            TOTAL2: sValue2Path && (oTotalData[sValue2Path] || 0),
                            FILTERED2: oFilteredValue2
                        });
                    }

                    this.updateCardHeaderSection(oCardConfig, oCardData, oDataSet, aTotalData, isFiltered, oDateFormat, oDisplayFormat);

                    // Update card content section
                    oCardData.loading = false;

                    if (oCardConfig.chart) {
                        oCardData.content.chart = this.buildChartMetadata(oCardConfig.chart, isFiltered);
                        oCardData.content.chart.data = oChartData;
                    } else if (oCardConfig.list) {
                        oCardData.content.list.data = oChartData;
                        oCardData.content.list.columns = this.getColumns(oCardConfig.list);
                    }

                    fnCallback(oCardData);
                }.bind(this),
                function () {
                    // Error
                    fnCallback(this.getNoData(oCardConfig, oCardData));
                }.bind(this)
            );
        },
        updateCardHeaderSection: function (oCardConfig, oCardData, oDataSet, aTotalData, isFiltered, oDateFormat, oDisplayFormat) {
            // Update card header section
            if (oCardConfig.subtitle && oCardConfig.subtitle.string) {
                oCardData.subtitle = oCardConfig.subtitle.string + (isFiltered ? " - Filtered" : "");
            }

            if (oCardData.header && oCardData.header.kpi) {
                if (oDataSet.length <= 0) {
                    // Handle no data
                    this.showNoDataHeader(oCardConfig, oCardData, aTotalData, isFiltered, oDateFormat, oDisplayFormat);
                    return;
                }

                var kpiIndex = oDataSet.length - 1;
                var comparisonIndex = kpiIndex - 1;
                var oDataSetCopy = jQuery.extend(true,{},oDataSet);
				//polyfill for Number.isFinite method to support IE
				
				  Number.isFinite = Number.isFinite || function(value) {
    					return typeof value === "number" && isFinite(value);
					}
			
	                var kpiData = oDataSetCopy[kpiIndex];
	                //Set kpi to accumulated value of oCardConfig.kpi.valuePath
	                kpiData[oCardConfig.kpi.valuePath] = oDataSet.reduce(function(acc, val){ 
	                		return parseFloat(acc[oCardConfig.kpi.valuePath] !== undefined && 
	                				acc[oCardConfig.kpi.valuePath] !== null ? acc[oCardConfig.kpi.valuePath] : Number.isFinite(acc) ? acc : 0) + 
	                				parseFloat(val[oCardConfig.kpi.valuePath] !== null ? val[oCardConfig.kpi.valuePath] : 0) ;
	                });
	                //mean debtor rate
	                if(oCardConfig.kpi.valuePath === "RATE"){
	                	kpiData[oCardConfig.kpi.valuePath] = kpiData[oCardConfig.kpi.valuePath]/oDataSet.length ;
	                }

                if (oCardConfig.kpi.ascending) {
                    kpiIndex = 0;
                    comparisonIndex = 1;
                    kpiData = oDataSetCopy[kpiIndex];
                }

                if (oCardConfig.subtitle && oCardConfig.subtitle.path) {
                    var subtitleValue = kpiData[oCardConfig.subtitle.path];

                    if (oDateFormat) {
                        var dateSubtitle = oDateFormat.parse(subtitleValue);

                        if (dateSubtitle && oDisplayFormat) {
                            subtitleValue = oDisplayFormat.format(dateSubtitle);
                        }
                    }
                    //Clear subtitleValue since accumulated values
					subtitleValue = "";
                    var subtitle = (oCardConfig.subtitle.prefix || '') + subtitleValue + (oCardConfig.subtitle.suffix || '') + (isFiltered ? " - Filtered" : "");
                    oCardData.subtitle = subtitle;
                }

                if (oCardConfig.kpi && oCardConfig.kpi.valuePath) {
                    var kpiValue = kpiData[oCardConfig.kpi.valuePath];

                    oCardData.header.kpi.value = parseFloat(kpiValue);
                    oCardData.header.kpi.formattedValue = TrendCardConstants.formatValue(kpiValue);

                    if (oCardConfig.kpi.unitPath) {
                        oCardData.header.kpi.unit = kpiData[oCardConfig.kpi.unitPath];
                    }

                    var delta = kpiValue;

                    if (oDataSet.length > 2) {
                        var comparisonData = oDataSet[comparisonIndex];

                        if (oCardConfig.kpi.ascending) {
                            comparisonData = oDataSet[comparisonIndex];
                        }

                        if (oCardConfig.comparison) {
                            var comparisonValue = comparisonData[oCardConfig.comparison.valuePath || oCardConfig.kpi.valuePath];

                            // Check both kpiValue and comparison value are defined and not null as null - null = 0 and undefined - undefined = NaN
                            if ((kpiValue || kpiValue === 0) && (comparisonValue || comparisonValue === 0)) {
                                delta = kpiValue - comparisonValue;
                            }


                            oCardData.header.comparison.value = parseFloat(delta);
                            oCardData.header.comparison.formattedValue = (delta > 0 ? "+" : "") + TrendCardConstants.formatValue(delta);
                        }
                    }

                    var sStyle = TrendCardConstants.STYLE.kpiValueNeutral;

                    // Ignore null or undefined values which should maintain a neutral style
                    /*if (delta || delta === 0) {
                     sStyle = delta < 0 ? TrendCardConstants.STYLE.kpiValueNegative : TrendCardConstants.STYLE.kpiValuePositive;

                     if (oCardConfig.kpi.direction == TrendCardConstants.TREND_DIRECTION.minimize) {
                     sStyle = delta > 0 ? TrendCardConstants.STYLE.kpiValueNegative : TrendCardConstants.STYLE.kpiValuePositive;
                     }
                     }*/

                    if (delta || delta === 0) {
                        sStyle = delta < 0 ? TrendCardConstants.STYLE.kpiValueNegative : TrendCardConstants.STYLE.kpiValuePositive;

                        if (oCardConfig.kpi.direction == TrendCardConstants.TREND_DIRECTION.minimize) {
                            sStyle = delta > 0 ? TrendCardConstants.STYLE.kpiValueNegative : TrendCardConstants.STYLE.kpiValuePositive;
                        }
                    }

                    oCardData.header.kpi.style = sStyle;
                }
            }
        },
        showNoDataHeader:function (oCardConfig, oCardData, aTotalData, isFiltered, oDateFormat, oDisplayFormat) {
            if (oCardConfig.subtitle && oCardConfig.subtitle.path) {
                var kpiIndex = aTotalData.length - 1;
                var kpiData = aTotalData[kpiIndex];
                if (kpiData) {
                    var subtitleValue = kpiData[oCardConfig.subtitle.path];

                    if (oDateFormat) {
                        var dateSubtitle = oDateFormat.parse(subtitleValue);

                        if (dateSubtitle && oDisplayFormat) {
                            subtitleValue = oDisplayFormat.format(dateSubtitle);
                        }
                    }

                    var subtitle = (oCardConfig.subtitle.prefix || '') + subtitleValue + (oCardConfig.subtitle.suffix || '') + (isFiltered ? " - Filtered" : "");
                    oCardData.subtitle = subtitle;
                }
            }

            if (oCardConfig.kpi && oCardConfig.kpi.valuePath) {
                var kpiValue = null;

                oCardData.header.kpi.value = 0;
                oCardData.header.kpi.formattedValue = TrendCardConstants.formatValue(kpiValue);

                if (oCardConfig.comparison) {
                    var delta = null;
                    oCardData.header.comparison.value = null;
                    oCardData.header.comparison.formattedValue = (delta > 0 ? "+" : "") + TrendCardConstants.formatValue(delta);
                }

                oCardData.header.kpi.style = TrendCardConstants.STYLE.kpiValueNeutral;
            }
        }
    };
});