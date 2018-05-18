//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/FilterService",
        "sap/fiori/cri/service/ExportService",
        "sap/fiori/cri/control/PulseChart",
        "sap/fiori/cri/model/PulseChartItem",
        "sap/fiori/cri/model/formatter",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/thirdparty/d3",
        "sap/ui/core/format/NumberFormat",
        "sap/ui/Device",
        "sap/m/Title",
        "sap/m/VBox",
        "sap/m/List",
        "sap/m/FlexItemData",
        "sap/m/HBox",
        "sap/m/Text",
        "sap/m/CustomListItem"
    ],
    /**
     * Customer Prediction Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.FilterService} FilterService Filter Service
     * @param {sap.fiori.cri.service.ExportService} ExportService Hybris Export Service
     * @param {sap.fiori.cri.control.PulseChart} PulseChart Pulse Chart
     * @param {sap.fiori.cri.model.PulseChartItem} PulseChartItem Pulse Chart Item
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator Filter Operator
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.thirdparty.d3} d3 D3
     * @param {sap.ui.core.format.NumberFormat} NumberFormat Number Format
     * @param {sap.ui.Device} Device Device
     * @param {sap.m.Title} Title Title
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.List} List List
     * @param {sap.m.FlexItemData} FlexItemData FlexItemData
     * @param {sap.m.HBox} HBox HBox
     * @param {sap.m.Text} Text Text
     * @param {sap.m.CustomListItem} CustomListItem CustomListItem
     * @returns {*} Customer Prediction Controller
     */
    function (BaseController, FilterService, ExportService, PulseChart, PulseChartItem, Formatter, JSONModel, Filter,
              FilterOperator, Sorter, d3, NumberFormat, Device, Title, VBox, List, FlexItemData, HBox, Text, CustomListItem) {
        "use strict";

        //noinspection JSValidateJSDoc
        return BaseController.extend("sap.fiori.cri.controller.CustomerPrediction", {
            /**
             * Controller init
             */
            Color: {
                Error: "rgb(231,140,7)",
                Neutral: "rgb(94,105,110)",
                Critical: "rgb(187,0,0)"
            },
            onInit: function () {
                var oJSONModel = new JSONModel({
                    FilteredBy:"",
                    HybrisEnabled:false,
                    Currency:"AUD",
                    SelectedCustomers: {
                        Count:"-",
                        Income:"-",
                        Risk:"-"
                    },
                    SelectedTabKey:"CustomerOverview" // "AllCustomers",

                });
                this.getView().setModel(oJSONModel, "viewModel");

                this.getView().setModel(new JSONModel());
            },
            onBeforeRendering: function () {
                this.togglePageLoading(true);
                this.togglePageContentLoading(true);

                this.loadLabels("CustomerPrediction", "en-US", function () {

                    this.updateFilterText();

                    this.updateThresholds(function () {
                        this.togglePageLoading(false);
                        this.updateBubbleChartThresholds();
                    }.bind(this));

                }.bind(this));

                this.toggleExportEnabled(Device.system.desktop);
            },
            onAfterRendering: function () {
                this.toggleExportEnabled(Device.system.desktop);
                //this.updateFilters();

                var oList = this.getView().byId("idSelectedCustomersList");
                var oModel = this.getView().getModel("viewModel");
                sap.ui.core.ResizeHandler.register(oList, function (oEvent) {
                    oModel.setProperty("/SelectedCustomersListWidth", (oEvent.size.width - 58) + "px");
                });
            },


            onFiltersLoaded: function (oEvent) {
                this.togglePageContentLoading(false);
                this.updateCustomersGraphic();
                this.updatePageContent();
                this.updateFilterText();
            },

            /**
             * Filter Change Event Handler
             * @param {sap.ui.base.Event} oEvent - Filter change event
             * @param {string} oEvent.mParameters.key - Filter key
             * @param {object} oEvent.mParameters.value - Filter value
             * @param {object} oEvent.mParameters.control - Filter control
             */
            onFilterChanged: function (oEvent) {
                this.updateFilters();
            },

            /**
             * Filters Cleared Event Handler
             * @param {sap.ui.base.Event} oEvent - Filter change event
             * @param {object} oEvent.mParameters.selectionSet - Set of filters cleared
             */
            onClearFilters: function (oEvent) {
                this.updateFilters();
            },

            onSelectTab: function (oEvent) {
                var oSelectedKey = oEvent.getParameters().selectedKey;
                var oModel = this.getView().getModel("viewModel");
                oModel.setProperty("/SelectedTabKey", oSelectedKey);

                var bAllCustomersTabShown = oModel.getProperty("/AllCustomersTabShown");
                if (!bAllCustomersTabShown) {
                    oModel.setProperty("/AllCustomersTabShown", true);
                    this.updateAllCustomersList();
                }
            },

            onSelectVisualFilterBubbles: function (oEvent) {
                var oFilters;

                var frame = oEvent.mParameters.selectionFrame;

                var aItems = oEvent.mParameters.items;
                if (aItems.length > 0 && frame) {

                    var aIncomeRange = [frame.getLeft(), frame.getRight()];
                    var aRiskRange = [frame.getTop(), frame.getBottom()];

                    if (aItems.length == 1) {
                        aIncomeRange = d3.extent(aItems, function (d) {
                            return d.getXValue();
                        });

                        aRiskRange = d3.extent(aItems, function (d) {
                            return d.getYValue();
                        });
                    }

                    var oIncomeFilter = new Filter({
                        path:"INCOME_LOSS",
                        operator:FilterOperator.BT,
                        value1:Math.floor(aIncomeRange[0]),
                        value2:Math.ceil(aIncomeRange[1])
                    });

                    var oRiskFilter = new Filter({
                        path:"INFLUENCE",
                        operator:FilterOperator.BT,
                        value1:Math.floor(aRiskRange[1]), // Values are reversed as BT uses GE value1 and LE value2 and y-axis values are in descending order
                        value2:Math.ceil(aRiskRange[0])
                    });

                    oFilters = new Filter({
                        filters:[oIncomeFilter, oRiskFilter],
                        and:true
                    });
                }

                this.getView().getModel("viewModel").setProperty("/CustomerSelectionFilters", oFilters);

                this.updatePageContent();
            },

            onCustomerExpand: function(oEvent) {
                var oColumnListItem = oEvent.getSource();
                oColumnListItem.setSelected(false);
                var oCells = oColumnListItem.getAggregation("cells");

                var oExpandCell = oCells[oCells.length - 1];

                var aItems = oExpandCell.getItems();

                if (aItems.length == 0) {

                    var oContext = oEvent.getSource().getBindingContext("CRI");
                    var sCustIdPath = oContext.getPath() + "/CUST_ID";
                    var sCustomerId = oContext.getModel().getProperty(sCustIdPath).toString();

                    this.addExpandedContent(oColumnListItem, oExpandCell, sCustomerId);
                }

                oExpandCell.setVisible(!oExpandCell.getVisible());
            },

            addExpandedContent: function (oRow, oExpandCell, sCustomerId) {
                oExpandCell.setHeight("200px");
                oExpandCell.setBusy(true);

                var sCustomerPath = "/Customer(" + sCustomerId + ")";
                var sPulsePath = sCustomerPath + "/Pulse";
                var sSimilarPath = sCustomerPath + "/Similar/$count";
                var oDataModel = this.getView().getModel("CRI");

                var that = this;

                /* SIMILAR CUSTOMERS CONTENT - Takes 14 seconds to load...

                var oSimilarCustomersCount = new sap.m.NumericContent({value:"-", withMargin:false});

                var oSimilarCustomersItem = new VBox({items: [
                    new Title({text: "{Labels>/SimilarCustomersHeading}"}).addStyleClass("sapUiTinyMarginBottom"),
                    oSimilarCustomersCount
                ]}).addStyleClass("sapUiMediumMarginEnd sapUiSmallMarginTopBottom");

                oExpandCell.addItem(oSimilarCustomersItem);

                oDataModel.read(sSimilarPath, {
                    success: function(oResponse) {
                        oSimilarCustomersCount.setValue(oResponse);
                    }, error: function(oError) {
                        oSimilarCustomersCount.setValue("N/A");
                    }
                });
                */

                var oSorter = new Sorter("INIT_DATE", true);
                oDataModel.read(sPulsePath, {
                    sorters: [oSorter],
                    success: function(oResponse) {
                        var aResults = oResponse.results;

                        oExpandCell.removeAllItems();

                        var oInfoItems = that.getCustomerInfoItems(aResults);
                        oInfoItems.forEach(function(oBox) {
                            oExpandCell.addItem(oBox);
                        });

                        oExpandCell.setBusy(false);
                    }, error: function(oError) {
                        oExpandCell.setBusy(false);
                    }
                });


            },

            getCustomerInfoItems: function(oData) {
                var oThresholds = this.getView().getModel('viewModel').getProperty("/Thresholds");

                var oActivitiesItem = new VBox({items: [
                    new Title({text: "{Labels>/LatestActivitiesHeading}"}).addStyleClass("sapUiTinyMarginBottom"),
                    new List({items: this.getRecentEventItems(oData), backgroundDesign:"Transparent"})
                ]}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom");

                oActivitiesItem.setLayoutData(new FlexItemData({
                    growFactor:1,
                    shrinkFactor:1,
                    minWidth:"0px"
                }));

                var oPulseChartItem = new VBox({width: "50%", items: [
                    new Title({text: "{Labels>/CustomerPulseHeading}"}).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginBottom"),
                    new PulseChart({items: this.getPulseChartItems(oData), height: "90%", width: "100%",
                        showSimplePulse: true, yAxisLabel: "", thresholdLowValue:oThresholds.MEDIUM_RISK, thresholdHighValue:oThresholds.HIGH_RISK})
                ]}).addStyleClass("sapUiMediumMarginBegin sapUiSmallMarginTopBottom");

                oPulseChartItem.setLayoutData(new FlexItemData({
                    shrinkFactor:0
                }));

                return [
                    oActivitiesItem,
                    oPulseChartItem
                ];
            },
            getRecentEventItems: function(oData) {
                var aRecentEvents = [];
                var iNumEvents = 3;
                if (oData.length < 3) {
                    iNumEvents = oData.length;
                }
                for (var iEventIndex = 0; iEventIndex < iNumEvents; iEventIndex++) {
                    var oEventData = oData[iEventIndex];
                    var sEventName = oEventData.EVENT_NAME;
                    var sEventDate = Formatter.stringFromDate(oEventData.INIT_DATE, "dd/MM/yyyy");
                    var oEventItem = new CustomListItem({content:[
                        new HBox({items:[
                            new Text({text:sEventDate, wrapping:false}).addStyleClass("sapUiSmallMarginEnd"),
                            new Text({text:sEventName, maxLines:2})
                        ]}).addStyleClass("sapUiTinyMarginTopBottom")
                    ]}).addStyleClass("sapUiSmallMarginTopBottom");
                    aRecentEvents.push(oEventItem);
                }
                return aRecentEvents;
            },

            getPulseChartItems: function(oData) {
                var aPulseChartItems = [];
                oData.forEach(function(oDataPoint) {
                    var oItem = new PulseChartItem();
                    oItem.setDateString(oDataPoint.INIT_DATE);
                    oItem.setValue(oDataPoint.INFLUENCE);
                    oItem.setLabel(oDataPoint.EVENT_NAME);
                    aPulseChartItems.push(oItem);
                });
                return aPulseChartItems;
            },

            togglePageLoading: function (bLoading) {
                this.getView().byId("idTabBar").setVisible(!bLoading);
                this.getView().byId("idPageContent").setBusy(bLoading);
            },

            togglePageContentLoading: function (bLoading) {
                this.getView().byId("idCustomerOverviewSection").setVisible(!bLoading);
                this.getView().byId("idSelectedCustomersSection").setVisible(!bLoading);
                this.getView().byId("idAllCustomersSection").setVisible(!bLoading);
            },

            updatePageContent: function () {
                this.updateSelectedCustomersContent(null);

                var aODataFilters = [];

                // Add customer search filters
                var oCustomerSearchFilter = this.getCustomerSearchODataFilter();
                if (oCustomerSearchFilter) {
                    aODataFilters.push(oCustomerSearchFilter);
                }
                //this.updateAllCustomersList(aODataFilters);

                var oViewModel = this.getView().getModel("viewModel");
                if (oViewModel.getProperty("/AllCustomersTabShown")) {
                    this.updateAllCustomersList(aODataFilters);
                }

                // Add customer selection filters
                var customerSelectionFilters = oViewModel.getProperty("/CustomerSelectionFilters");
                if (customerSelectionFilters) {
                    aODataFilters.push(customerSelectionFilters);

                    if (aODataFilters.length > 1) {
                        aODataFilters = [new Filter({filters: aODataFilters, and: true})];
                    }

                    // Only show content if there is a selection
                    this.updateSelectedCustomersContent(aODataFilters);
                }
            },

            updateCustomersGraphic: function () {

                var oBubbleChart = this.getView().byId("idCustomerOverviewBubbleChart");
                //oBubbleChart.setBusy(true);

                var oItemTemplate = this.getView().byId("idCustomerOverviewBubbleChartItemTemplate");

                var sPath = "CRI>";
                var sFilterString = FilterService.getEncodedFilterString() || "";
                sPath += "/AtRiskCustomerGraphicParameters(IP_FILTER='" + sFilterString + "')/Results";
                //sPath += "/AtRiskCustomerGraphic";

                var oCustomerGraphicBinding = {
                    path: sPath,
                    length:1000,
                    template: oItemTemplate
                };

                if (!this.fnCustomerGraphicDataRequested) {
                    this.fnCustomerGraphicDataRequested = function () {
                        oBubbleChart.setBusy(true);
                    };
                }

                if (!this.fnCustomerGraphicDataReceived) {
                    this.fnCustomerGraphicDataReceived = function () {
                        oBubbleChart.setBusy(false);
                    };
                }

                var oBinding = oBubbleChart.getBinding("items");

                oBinding.detachDataRequested(this.fnCustomerGraphicDataRequested, this);
                oBinding.detachDataReceived(this.fnCustomerGraphicDataReceived, this);

                oBubbleChart.bindAggregation("items", oCustomerGraphicBinding);

                oBinding = oBubbleChart.getBinding("items");

                this.fnCustomerGraphicDataRequested();

                oBinding.attachDataRequested(this.fnCustomerGraphicDataRequested, this);
                oBinding.attachDataReceived(this.fnCustomerGraphicDataReceived, this);

            },

            updateSelectedCustomersContent: function (oFilters) {
                this.updateSelectedCustomersOverview(oFilters);
                this.updateSelectedCustomersList(oFilters);
            },

            updateSelectedCustomersOverview: function (oFilters) {
                var oModel = this.getView().getModel("viewModel");

                if (oFilters == null) {
                    oModel.setProperty("/SelectedCustomers/Count", "-");
                    oModel.setProperty("/SelectedCustomers/Income", "-");
                    oModel.setProperty("/SelectedCustomers/Risk", "-");
                    return;
                }

                var sFilterString = FilterService.getEncodedFilterString() || "";

                this.getView().getModel("CRI").read("/AtRiskCustomerTopParameters(IP_FILTER='" + sFilterString + "')/Results", {
                    filters:oFilters,
                    urlParameters:{"$select":["CUST_ID","INFLUENCE","INCOME_LOSS"]},
                    success:function (oResponse) {
                        var dIncome = 0;
                        var dRiskSum = 0;

                        var results = oResponse.results;
                        results.forEach(function (oItem) {
                            dIncome += Number(oItem["INCOME_LOSS"]);
                            dRiskSum += Number(oItem["INFLUENCE"]);
                        });

                        var iCount = results.length;
                        var dRisk = dRiskSum / iCount;

                        iCount = this.formatValue(iCount);
                        dIncome = this.formatValue(dIncome);
                        dRisk = this.formatValue(dRisk, 0);

                        oModel.setProperty("/SelectedCustomers/Count", iCount);
                        oModel.setProperty("/SelectedCustomers/Income", dIncome);
                        oModel.setProperty("/SelectedCustomers/Risk", dRisk);
                    }.bind(this),
                    error: function (oError) {
                        var iCount = this.formatValue(null);
                        var dIncome = this.formatValue(null);
                        var dRisk = this.formatValue(null);

                        oModel.setProperty("/SelectedCustomers/Count", iCount);
                        oModel.setProperty("/SelectedCustomers/Income", dIncome);
                        oModel.setProperty("/SelectedCustomers/Risk", dRisk);
                    }.bind(this)
                });
            },

            updateSelectedCustomersList: function (oFilters) {
                var oItemTemplate = this.getView().byId("idSelectedCustomersItemTemplate");

                var sFilterString = FilterService.getEncodedFilterString() || "";

                // If no customer selection, use the empty model path to clear data
                var sPath = "CRI>";
                if (oFilters) {
                    sPath += "/AtRiskCustomerTopParameters(IP_FILTER='" + sFilterString + "')/Results";
                }

                var oCustomerListBinding = {
                    path: sPath,
                    filters: oFilters,
                    template: oItemTemplate
                };

                var oCustomersList = this.getView().byId("idSelectedCustomersList");
                oCustomersList.bindAggregation("items", oCustomerListBinding);
            },

            updateAllCustomersList: function (oFilters) {
                var oItemTemplate = this.getView().byId("idAllCustomersItemTemplate");

                var sFilterString = FilterService.getEncodedFilterString() || "";

                var oCustomerListBinding = {
                    path: "CRI>" + "/AtRiskCustomersParameters(IP_FILTER='" + sFilterString + "')/Results",
                    sorter: new Sorter("INFLUENCE", true),
                    filters: oFilters,
                    template: oItemTemplate
                };

                var oCustomersList = this.getView().byId("idAllCustomersList");
                oCustomersList.bindAggregation("items", oCustomerListBinding);
            },

            /**
             * Update Filters
             * Updates the page based on current filter selection
             */
            updateFilters:function () {
                this.updateFilterText();
                this.updateCustomersGraphic();
                this.updatePageContent();
            },

            /**
             * Update Filter Text
             * Updates the text shown on the collapsed filter bar area
             */
            updateFilterText:function () {
                var sFilteredBy = this.getView().byId("idFilterBar").getFilteredByString();
                this.getView().getModel("viewModel").setProperty("/FilteredBy", sFilteredBy);
            },

            getCustomerSearchODataFilter: function () {
                var sCustomerName = this.getCustomerSearchFilterValue();
                if (sCustomerName) {
                    var sEncodedFilterString = encodeURIComponent("'" + sCustomerName.toLowerCase() + "'");
                    return new Filter("tolower(NAME)", FilterOperator.Contains, sEncodedFilterString);
                }
                return null;
            },

            getCustomerSearchFilterValue: function() {
                var oFilterKeys = FilterService.getFilterConfig().filterKeys;
                var sSearchValue = FilterService.getFilterValue(oFilterKeys.customerSearchQuery);

                var oControl = this.byId("idFilterBar").getFilterControl(oFilterKeys.customerSearchQuery);
                if (oControl) {
                    sSearchValue = oControl.getProperty("value");
                }

                return sSearchValue;
            },

            updateThresholds: function (fnCompletion) {
                var oThresholds = this.getView().getModel('viewModel').getProperty("/Thresholds");
                if (oThresholds) {
                    if (fnCompletion) { fnCompletion(oThresholds); }
                    return;
                }
                this.getView().getModel("CRI").read("/UseCaseConfig", {
                    urlParameters: {
                        "$expand": "Config"
                    },
                    filters: [
                        new Filter("IS_ENABLED", FilterOperator.EQ, 1)
                    ],
                    success: function (oData) {

                        var oThresholdsById = {};

                        oData.results[0]['Config'].results.forEach(function (oItem) {
                            var id = oItem["BUCKET_ID"];
                            var seq = oItem["SEQ"];
                            var items = oThresholdsById[id] || {};
                            items[seq] = oItem;
                            oThresholdsById[id] = items;
                        });

                        var oThresholds = {"CUSTOMER_RISK":{}, "INCOME":{}, "DAYS_TO_REACT":{}};

                        var risk = oThresholdsById["CUSTOMER_RISK"];
                        oThresholds.CUSTOMER_RISK = {
                            LOW:parseFloat(risk["1"].FROM_VALUE),
                            MEDIUM:parseFloat(risk["1"].TO_VALUE),
                            HIGH:parseFloat(risk["3"].FROM_VALUE),
                            MAX:parseFloat(risk["3"].TO_VALUE)
                        };

                        var risk = oThresholdsById["INCOME_LOSS"];
                        oThresholds.INCOME_LOSS = {
                            LOW:parseFloat(risk["1"].FROM_VALUE),
                            MEDIUM:parseFloat(risk["1"].TO_VALUE),
                            HIGH:parseFloat(risk["3"].FROM_VALUE),
                            MAX:parseFloat(risk["3"].TO_VALUE)
                        };

                        var daysToChurn = oThresholdsById["DAYS_TO_REACT"];
                        oThresholds.DAYS_TO_REACT = {
                            LOW:parseFloat(daysToChurn["1"].FROM_VALUE),
                            MEDIUM:parseFloat(daysToChurn["1"].TO_VALUE),
                            HIGH:parseFloat(daysToChurn["4"].FROM_VALUE),
                            MAX:parseFloat(daysToChurn["4"].TO_VALUE)
                        };

                        this.getView().getModel('viewModel').setProperty("/Thresholds", oThresholds);

                        if (fnCompletion) { fnCompletion(oThresholds); }

                    }.bind(this),
                    error: function () {
                        if (fnCompletion) { fnCompletion(null); }
                    }
                });
            },

            updateBubbleChartThresholds: function () {
                var oThresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");

                var oBubbleChart = this.getView().byId("idCustomerOverviewBubbleChart");

                var xAxisThresholds = [oThresholds.INCOME_LOSS.LOW, oThresholds.INCOME_LOSS.MEDIUM, oThresholds.INCOME_LOSS.HIGH];
                var yAxisThresholds = [oThresholds.CUSTOMER_RISK.LOW, oThresholds.CUSTOMER_RISK.MEDIUM, oThresholds.CUSTOMER_RISK.HIGH];

                oBubbleChart.setProperty("xAxisThresholds", xAxisThresholds);
                oBubbleChart.setProperty("yAxisThresholds", yAxisThresholds);
                oBubbleChart.redraw();
            },

            /**
             * Toggle Export functionality
             * @param {boolean} isEnabled - toggle state
             */
            toggleExportEnabled: function (isEnabled) {
                this.byId("idExportSelectedCustomers").setVisible(isEnabled);
                this.byId("idExportAllCustomers").setVisible(isEnabled);
            },
            formatRiskColor: function (value) {
                var thresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                if (!thresholds) { return "Error"; }

                var threshold = thresholds.CUSTOMER_RISK;

                if (value <= threshold.MEDIUM) {
                    return this.Color.Neutral;
                } else if (value <= threshold.HIGH) {
                    return this.Color.Error;
                } else {
                    return this.Color.Critical;
                }
            },
            formatDaysToChurnColor: function (value) {
                var thresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                if (!thresholds) { return "Error"; }
                var threshold = thresholds.DAYS_TO_REACT;

                if (value <= threshold.MEDIUM) {
                    return this.Color.Critical;
                } else if (value <= threshold.HIGH) {
                    return this.Color.Error;
                } else {
                    return this.Color.Neutral;
                }
            },

            formatValue: function (value, maxDigits, sNoDataValue) {
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
                    maxFractionDigits: maxDigits || iMaxDigits,
                    style:sFormatStyle
                });

                if (value || value == 0) {
                    return oNumberFormat.format(value);
                } else {
                    // Handle null or undefined values
                    return sNoDataValue || "N/A";
                }
            },

            validateNumber: function (oValue) {
                return Number(oValue) || 0;
            },

            showCustomerDetails: function (event) {
                var context = event.getSource().getParent().getBindingContext('CRI');
                var custIdPath = context.getPath() + "/CUST_ID";
                var customerId = context.getModel().getProperty(custIdPath);

                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNav.toExternal({
                    target: {semanticObject: "CustomerDetails", action: "display"},
                    params: {customerId: customerId}
                });
            },
            exportSelectedCustomerList: function (event) {
                var table = this.getView().byId("idSelectedCustomersList");
                var selectedCustomers = table.getSelectedItems();
                var exportCustomers = selectedCustomers.map(function (row) {
                    return ExportService.mapToCustomer(row.getBindingContext("CRI").getObject());
                });
                this.getOwnerComponent().exportDialog.open(this.getView(), exportCustomers);
            },
            exportCustomerList: function (event) {
                var table = this.getView().byId("idAllCustomersList");
                var selectedCustomers = table.getSelectedItems();
                var exportCustomers = selectedCustomers.map(function (row) {
                    return ExportService.mapToCustomer(row.getBindingContext("CRI").getObject());
                });

                this.getOwnerComponent().exportDialog.open(this.getView(), exportCustomers);
            }
        });
    });