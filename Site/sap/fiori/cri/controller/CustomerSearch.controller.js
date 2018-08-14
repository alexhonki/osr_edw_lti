//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/FilterService",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/m/ColumnListItem",
        "sap/m/HBox",
        "sap/m/VBox",
        "sap/m/Button",
        "sap/m/Text",
        "sap/m/ObjectNumber",
        "sap/m/FlexAlignItems",
        "sap/m/FlexJustifyContent",
        "sap/m/ButtonType",
        "sap/suite/ui/microchart/BulletMicroChart",
        "sap/suite/ui/microchart/BulletMicroChartData",
        "sap/suite/ui/microchart/CommonBackgroundType"
    ],
    /**
     * Search Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.FilterService} FilterService Filter Service
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator Filter operator
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.m.ColumnListItem} ColumnListItem ColumnListItem
     * @param {sap.m.HBox} HBox HBox
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.Button} Button Button
     * @param {sap.m.Text} Text Text
     * @param {sap.m.ObjectNumber} ObjectNumber ObjectNumber
     * @param {sap.m.FlexAlignItems} FlexAlignItems FlexAlignItems
     * @param {sap.m.FlexJustifyContent} FlexJustifyContent FlexJustifyContent
     * @param {sap.m.ButtonType} ButtonType ButtonType
     * @param {sap.suite.ui.microchart.BulletMicroChart} BulletMicroChart BulletMicroChart control
     * @param {sap.suite.ui.microchart.BulletMicroChartData} BulletMicroChartData BulletMicroChart data
     * @param {sap.suite.ui.microchart.CommonBackgroundType} CommonBackgroundType Microchart background type
     * @returns {*} Customer Search Controller
     */
    function (BaseController, FilterService, ErrorService, JSONModel, Filter, FilterOperator, Sorter, ColumnListItem,
              HBox, VBox, Button, Text, ObjectNumber, FlexAlignItems, FlexJustifyContent, ButtonType, BulletMicroChart,
              BulletMicroChartData, CommonBackgroundType) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.CustomerSearch", {
            _defaultSortConfig:{
                path:"SCORE",
                descending:true
            },
            CustomerSearchFilterStorageKey: "CustomerSearchFilters",
            onInit: function () {
                var oJSONModel = new JSONModel({CustomerListItems:[]});
                this.getView().setModel(oJSONModel, "viewModel");
            },
            onBeforeRendering: function () {
                this.loadLabels("CustomerSearch", "en-US");
                this.updateThresholds();
            },
            onAfterRendering: function () {
                // Show no customers when first loading
                var customerList = this.byId("idCustomerListTable");
                customerList.setModel(this.getView().getModel("viewModel"));
                var pagePanel = this.byId("idCustSearchPanel");
                pagePanel.setBusyIndicatorDelay(0);
                //customerList.setBusy(false);
                //customerList.unbindAggregation("items");

                var sQuery = FilterService.getFilterValue("CustomerSearchQuery", this.CustomerSearchFilterStorageKey);
                this.getView().getModel("viewModel").setProperty("/SearchString", sQuery);
                this.filterCustomerList(sQuery);
            },
            updateThresholds: function () {
                this.getView().getModel("CRI").read("/UseCaseConfig", {
                    urlParameters: {
                        "$expand": "Config"
                    },
                    filters: [
                        new Filter("IS_ENABLED", FilterOperator.EQ, 1)
                    ],
                    success: function (oData) {
                        try {
                            var oThresholdsById = {};

                            oData.results[0]['Config'].results.forEach(function (oItem) {
                                var id = oItem["BUCKET_ID"];
                                var seq = oItem["SEQ"];
                                var items = oThresholdsById[id] || {};
                                items[seq] = oItem;
                                oThresholdsById[id] = items;
                            });

                            var oThresholds = this.getView().getModel('viewModel').getProperty("/Thresholds") || {"INFLUENCE":{},"DAYS_TO_REACT":{}};

                            var risk = oThresholdsById["INFLUENCE"];
                            oThresholds.INFLUENCE.LOW = parseFloat(risk["1"].FROM_VALUE);
                            oThresholds.INFLUENCE.MEDIUM = parseFloat(risk["1"].TO_VALUE);
                            oThresholds.INFLUENCE.HIGH = parseFloat(risk["2"].TO_VALUE);
                            oThresholds.INFLUENCE.MAX = parseFloat(risk["3"].TO_VALUE);

                            var daysToChurn = oThresholdsById["DAYS_TO_REACT"];
                            oThresholds.DAYS_TO_REACT.LOW = parseFloat(daysToChurn["1"].FROM_VALUE);
                            oThresholds.DAYS_TO_REACT.MEDIUM = parseFloat(daysToChurn["1"].TO_VALUE);
                            oThresholds.DAYS_TO_REACT.HIGH = parseFloat(daysToChurn["2"].TO_VALUE);
                            oThresholds.DAYS_TO_REACT.MAX = parseFloat(daysToChurn["3"].TO_VALUE);

                            this.getView().getModel('viewModel').setProperty("/Thresholds", oThresholds);

                            this.getView().getModel('viewModel').refresh(true);
                            //this.getView().getModel('viewModel').setProperty("/SuggestedCustomers", this.getView().getModel("viewModel").getProperty("/SuggestedCustomers"));
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }.bind(this)
                });
            },
            formatRiskColor: function (value) {
                var thresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                if (!thresholds) { return "Error"; }

                var threshold = thresholds.INFLUENCE;

                if (value < threshold.MEDIUM) {
                    return "Neutral";
                } else if (value < threshold.HIGH) {
                    return "Critical";
                } else {
                    return "Error";
                }
            },
            formatDaysToChurnColor: function (value) {
                var thresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                if (!thresholds) { return "Error"; }
                var threshold = thresholds.DAYS_TO_REACT;

                if (value < threshold.MEDIUM) {
                    return "Error";
                } else if (value < threshold.HIGH) {
                    return "Critical";
                } else {
                    return "Neutral";
                }
            },
            showCustomerDetails: function (event) {
                var context = event.getSource().getParent().getBindingContext();
                var custIdPath = context.getPath() + "/CUST_ID";
                var customerId = context.getModel().getProperty(custIdPath);

                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNav.toExternal({
                    target: {semanticObject: "CustomerDetails", action: "display"},
                    params: {customerId: customerId}
                });
            },
            filterCustomers : function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                FilterService.setFilterValue("CustomerSearchQuery", sQuery, this.CustomerSearchFilterStorageKey);
                this.filterCustomerList(sQuery);
            },
            filterCustomerList: function (sQuery) {
                var oModel = this.getView().getModel("viewModel");
                var oDataModel = this.getView().getModel("CRI");

                var searchPath =  '/CustomerSearchParameters(IP_QUERY=\'' + encodeURIComponent(sQuery)  + '\')/Results';

                var customerTemplate = this.getView().getModel("viewModel").getProperty("/customerTemplate");
                if (!customerTemplate) {
                    customerTemplate = this.byId('idCustomerItemTemplate');
                    this.getView().getModel("viewModel").setProperty("/customerTemplate", customerTemplate);
                }

                oModel.setProperty("/CustomerListItems", []);

                if (!sQuery || sQuery.trim() == "") { return; } // Don't return a result for empty search query

                var customerList = this.byId("idCustSearchPanel");
                customerList.setBusy(true);

                //customerList.getAggregationBinding("items")
                var mSorterConfig = FilterService.getFilterValue("CustomerListSorter", this.CustomerSearchFilterStorageKey);

                //var mSorterConfig = this.getView().getModel("viewModel").getProperty("/Sorter");
                var oSorter = new Sorter(this._defaultSortConfig.path, this._defaultSortConfig.descending);
                if (mSorterConfig && mSorterConfig.path != null) {
                    oSorter = new Sorter(mSorterConfig.path, mSorterConfig.descending);
                }

                oDataModel.read(searchPath, {
                    sorters: [oSorter],
                    urlParameters: {
                        $expand: "Customer/Reactions"
                    },
                    success:function (oResponse) {
                        try {
                            var aCustomers = oResponse.results;
                            var aActiveCustomers = [];
                            var aReactedCustomers = [];
                            aCustomers.forEach(function (oCustomer) {
                                if (oCustomer.DAYS_TO_REACT == null) {
                                    aReactedCustomers.push(oCustomer);
                                    var aReactions = oCustomer.Customer.Reactions;
                                    oCustomer.REACTION_DATE = aReactions
                                        && aReactions.results
                                        && aReactions.results.length > 0
                                        && aReactions.results[0].INIT_TS
                                        || null;
                                } else {
                                    aActiveCustomers.push(oCustomer);
                                }
                            });

                            this.sortItems(aReactedCustomers, "REACTION_DATE", true);
                            var aOrderedCustomers = aActiveCustomers.concat(aReactedCustomers);

                            oModel.setProperty("/CustomerListItems", aOrderedCustomers);
                            customerList.setBusy(false);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        customerList.setBusy(false);
                    }
                });
            },
            customerListItemFactory: function (sId, oContext) {
                return new ColumnListItem(sId, {
                    cells: [
                        new Text( { text:"{NAME}" }).addStyleClass("name"),
                        new Text({ text:"{EXT_ID}" }),
                        this.buildRiskCell(),
                        new ObjectNumber({
                            textAlign:"Right",
                            number:{
                                parts:[{path:'INCOME_LOSS'},{path:'CURRENCY'}],
                                type: 'sap.ui.model.type.Currency',
                                formatOptions: {showMeasure: false}
                            },
                            unit:"{CURRENCY}"
                        }),
                        this.buildReactionCell(),
                        new HBox({
                            alignItems:FlexAlignItems.Center,
                            justifyContent:FlexJustifyContent.End,
                            items:[
                                new Button({
                                    icon:"sap-icon://navigation-right-arrow",
                                    type:ButtonType.Transparent,
                                    press:this.showCustomerDetails.bind(this)
                                })
                            ]
                        })
                    ]
                });
            },
            buildRiskCell:function () {
                var oRiskChartData = new BulletMicroChartData({
                    value:"{INFLUENCE}",
                    color:{
                        path:'INFLUENCE',
                        formatter:this.formatRiskColor.bind(this)
                    }
                });

                var oRiskControl = new BulletMicroChart({
                    visible:"{= ${INFLUENCE} === null ? false : true}",
                    scale:"%",
                    scaleColor:CommonBackgroundType.Transparent,
                    isResponsive:true,
                    minValue:0,
                    maxValue:100,
                    showValueMarker:false,
                    showTargetValue:false,
                    showActualValue:true,
                    actual: oRiskChartData
                }).addStyleClass("sapUiSmallMarginTopBottom");

                var oRiskText = new Text(
                    {
                        visible:"{= ${INFLUENCE} === null ? true : false}",
                        text:"{Labels>/CustomerListItemNoRisk}",
                        textAlign:"Begin"
                    });

                return new VBox({
                    alignItems:FlexAlignItems.Start,
                    items:[
                        oRiskControl,
                        oRiskText
                    ]
                });
            },
            buildReactionCell: function () {
                var oReactChartData = new BulletMicroChartData({
                    value:"{DAYS_TO_REACT}",
                    color:{
                        path:'DAYS_TO_REACT',
                        formatter:this.formatDaysToChurnColor.bind(this)
                    }
                });

                var oReactChart = new BulletMicroChart({
                    visible:"{= ${DAYS_TO_REACT} === null ? false : true}",
                    scale:"D",
                    scaleColor:CommonBackgroundType.Transparent,
                    isResponsive:true,
                    minValue:0,
                    maxValue:120,
                    showValueMarker:false,
                    showTargetValue:false,
                    showActualValue:true,
                    actual:oReactChartData
                }).addStyleClass("daysToReact sapUiSmallMarginTopBottom");

                var oReactText = new Text({
                    visible:"{= ${DAYS_TO_REACT} === null ? true : false}",
                    text:{
                        path:'',
                        formatter:this.formatReactionText.bind(this)
                    }
                });

                return new VBox({
                    alignItems:FlexAlignItems.Start,
                    items:[
                        oReactChart,
                        oReactText
                    ]
                }).addStyleClass("sapUiResponsiveContentPadding sapUiSmallMarginBegin");
            },
            formatReactionText:function (oData) {
                if (oData.LOADING_REACTION) {
                    return "Loading...";
                } else if (oData.REACTION_DATE) {
                    var sLabel = this.getView().getModel("Labels").getProperty("/CustomerListItemReacted");
                    return sLabel + " " + oData.REACTION_DATE;
                } else {
                    return "N/A";
                }
            },
            handleViewSettingsDialogButtonPressed: function (oEvent) {
                var mSorterConfig = FilterService.getFilterValue("CustomerListSorter", this.CustomerSearchFilterStorageKey);
                var sPath = mSorterConfig && mSorterConfig.path || null;
                var bDescending = mSorterConfig && mSorterConfig.descending || false;

                var oLabelModel = this.getView().getModel("Labels");
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.TableViewSettingsDialog", this);

                    this._oDialog.setModel(new JSONModel({
                        SortDescending:bDescending,
                        SortItems:[
                            {
                                Text: oLabelModel.getProperty("/CustomerListColumnName"),
                                Key: "NAME",
                                Selected: sPath == "NAME"
                            },
                            {
                                Text: oLabelModel.getProperty("/CustomerListColumnId"),
                                Key: "EXT_ID",
                                Selected: sPath == "EXT_ID"
                            },
                            {
                                Text: oLabelModel.getProperty("/CustomerListColumnRisk"),
                                Key: "INFLUENCE",
                                Selected: sPath == "INFLUENCE"
                            },
                            {
                                Text: oLabelModel.getProperty("/CustomerListColumnOperatingIncomeLoss"),
                                Key: "INCOME_LOSS",
                                Selected: sPath == "INCOME_LOSS"
                            },
                            {
                                Text: oLabelModel.getProperty("/CustomerListColumnDaysToReact"),
                                Key: "DAYS_TO_REACT",
                                Selected: sPath == "DAYS_TO_REACT"
                            },
                            {
                                Text: "None",
                                Key: this._defaultSortConfig.path,
                                Selected: sPath == this._defaultSortConfig.path
                            }
                        ]
                    }));
                }

                // toggle compact style
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
                this._oDialog.open();
            },
            handleConfirm: function(oEvent) {
                var mParams = oEvent.getParameters();

                var sPath = mParams.sortItem.getKey();
                var bDescending = mParams.sortDescending;

                if (!sPath) {
                    sPath = this._defaultSortConfig.path;
                    bDescending = this._defaultSortConfig.descending;
                }

                var oSorter = {
                    path:sPath,
                    descending:bDescending
                };

                //this.getView().getModel("viewModel").setProperty("/Sorter", oSorter);
                FilterService.setFilterValue("CustomerListSorter", oSorter, this.CustomerSearchFilterStorageKey);

                var oItems = this.getView().getModel("viewModel").getProperty("/CustomerListItems");
                this.getView().getModel("viewModel").setProperty("/CustomerListItems", []);

                this.sortItems(oItems, sPath, bDescending);

                this.getView().getModel("viewModel").setProperty("/CustomerListItems", oItems);
            },
            sortItems:function (oItems, sPath, bDescending) {
                oItems.sort(function (oItem1, oItem2) {

                    // Push 'reacted' customers to the bottom, sorted by reaction date
                    if (oItem1.DAYS_TO_REACT == null && oItem2.DAYS_TO_REACT == null) {
                        // Both have 'reacted', order by reaction date ascending
                        return this.compare(oItem1, oItem2, "REACTION_DATE", true);
                    }
                    if (oItem1.DAYS_TO_REACT == null) { return 1; } // First has reacted, push to bottom
                    if (oItem2.DAYS_TO_REACT == null) { return -1; } // Second has reacted, push to bottom

                    // Sort non-reacted customers
                    return this.compare(oItem1, oItem2, sPath, bDescending);
                }.bind(this));
            },
            compare:function (oItem1, oItem2, sPath, bDescending) {
                var value1 = oItem1[sPath];
                var value2 = oItem2[sPath];

                // Try converting to numeric values for sorting
                value1 = Number(value1) || value1;
                value2 = Number(value2) || value2;

                // Push items without a value to the bottom of the list
                if (value1 == null) { return 1; }
                if (value2 == null) { return -1; }

                if (bDescending){
                    if (value2 < value1) { return -1; }
                    if (value2 > value1) { return 1; }
                    return 0;
                }
                if (value1 < value2) { return -1; }
                if (value1 > value2) { return 1; }
                return 0;
            }
        });
    });