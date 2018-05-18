sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/FilterService",
        "sap/fiori/cri/control/PulseChart",
        "sap/fiori/cri/model/PulseChartItem",
        "sap/fiori/cri/model/formatter",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/core/Icon",
        "sap/m/VBox",
        "sap/m/FormattedText",
        "sap/m/Text",
        "sap/m/ObjectNumber",
        "sap/m/CustomListItem",
        "sap/m/HBox",
        "sap/m/Button",
        "sap/m/List",
        "sap/m/DisplayListItem"
    ],

    /**
     * Main controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController BaseController
     * @param {sap.fiori.cri.service.FilterService} FilterService FilterService
     * @param {sap.fiori.cri.control.PulseChart} PulseChart PulseChart
     * @param {sap.fiori.cri.model.PulseChartItem} PulseChartItem PulseChartItem
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @param {sap.fiori.cri.service.ErrorService} ErrorService ErrorService
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.core.Icon} Icon Icon
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.FormattedText} FormattedText FormattedText
     * @param {sap.m.Text} Text Text
     * @param {sap.m.ObjectNumber} ObjectNumber ObjectNumber
     * @param {sap.m.CustomListItem} CustomListItem CustomListItem
     * @param {sap.m.HBox} HBox HBox
     * @param {sap.m.Button} Button Button
     * @param {sap.m.List} List List
     * @param {sap.m.DisplayListItem} DisplayListItem DisplayListItem
     * @returns {*} BaseController
     */

    function (BaseController, FilterService, PulseChart, PulseChartItem, Formatter, ErrorService, JSONModel, Filter,
    FilterOperator, Sorter, Icon, VBox, FormattedText, Text, ObjectNumber, CustomListItem, HBox, Button, List, DisplayListItem) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.Search", {
            formatter: Formatter,
            _defaultSortConfig: {
                path:"SCORE",
                descending: true
            },
            SearchFilterStorageKey: "SearchFilters",
            onInit: function() {
                var oJSONModel = new JSONModel({SearchListItems:[]});
                this.getView().setModel(oJSONModel, "viewModel");
            },
            onBeforeRendering: function() {
                this.loadLabels("Search", "en-US");
                this.updateThresholds();
            },
            onAfterRendering: function() {
                var oResultList = this.byId("idResultList");
                oResultList.setModel(this.getView().getModel("viewModel"));
                var oPagePanel = this.byId("idSearchPanel");
                oPagePanel.setBusyIndicatorDelay(0);

                var sQuery = FilterService.getFilterValue("SearchQuery", this.SearchFilterStorageKey);
                this.getView().getModel("viewModel").setProperty("/SearchString", sQuery);
                this.filterResultList(sQuery);
                this.updateListHeading();
            },
            updateThresholds: function() {
                this.byId('idSearchPanel').setBusy(true);
                this.getView().getModel("CRI").read("/UseCaseConfig", {
                    filters: [new Filter("IS_ENABLED", FilterOperator.EQ, 1)],
                    urlParameters: {
                        $expand:"Config"
                    },
                    success: function (oData) {
                        try {
                            var useCases = oData.results;
                            if (useCases.length == 0) {
                                return;
                            }

                            var configItems = useCases[0].Config.results;

                            var oThresholdsById = {};

                            configItems.forEach(function (oItem) {
                                var id = oItem["BUCKET_ID"];
                                var seq = oItem["SEQ"];
                                var items = oThresholdsById[id] || {};
                                items[seq] = oItem;
                                oThresholdsById[id] = items;
                            });

                            var oThresholds = this.getView().getModel('viewModel').getProperty("/Thresholds") || {
                                    "INFLUENCE": {},
                                    "DAYS_TO_REACT": {}
                                };

                            var risk = oThresholdsById["INFLUENCE"];
                            oThresholds.INFLUENCE.LOW = parseFloat(risk["1"].FROM_VALUE);
                            oThresholds.INFLUENCE.MEDIUM = parseFloat(risk["1"].TO_VALUE);
                            oThresholds.INFLUENCE.HIGH = parseFloat(risk["2"].TO_VALUE);
                            oThresholds.INFLUENCE.MAX = parseFloat(risk["3"].TO_VALUE);

                           /*  DAYS_TO_REACT: {
                                LOW: 0,
                                    MEDIUM: 30,
                                        HIGH: 60,
                                            MAX: 90
                            } */
                            // var daysToChurn = oThresholdsById["DAYS_TO_REACT"];
                            // oThresholds.DAYS_TO_REACT.LOW = parseFloat(daysToChurn["1"].FROM_VALUE);
                            // oThresholds.DAYS_TO_REACT.MEDIUM = parseFloat(daysToChurn["1"].TO_VALUE);
                            // oThresholds.DAYS_TO_REACT.HIGH = parseFloat(daysToChurn["2"].TO_VALUE);
                            // oThresholds.DAYS_TO_REACT.MAX = parseFloat(daysToChurn["3"].TO_VALUE);

                            this.getView().getModel('viewModel').setProperty("/Thresholds", oThresholds);

                            this.getView().getModel('viewModel').refresh(true);
                            //this.getView().getModel('viewModel').setProperty("/SuggestedCustomers", this.getView().getModel("viewModel").getProperty("/SuggestedCustomers"));
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        } finally {
                            this.byId('idSearchPanel').setBusy(false);
                        }
                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        this.byId('idSearchPanel').setBusy(false);
                    }.bind(this)
                });
            },
            getRiskThresholdValue: function(sLevel) {
                var aThresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                var aThreshold = aThresholds.INFLUENCE;
                switch (sLevel) {
                    case "Low": return aThreshold.LOW;
                    case "Medium": return aThreshold.MEDIUM;
                    case "High": return aThreshold.HIGH;
                    default: return 0;
                }
            },
            formatRiskValue: function(iValue) {
                if (!iValue) {
                    return "N/A";
                }
                return iValue.toString() + "%";
            },
            formatExistingValue: function(iValue) {
                if (!iValue) {
                    return "N/A";
                }
                return iValue;
            },
            formatRiskColor: function(iValue) {
                var sColorClass = "";
                var aThresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                //temp fix to load data
                if(aThresholds){
                    var aThreshold = aThresholds.INFLUENCE;
                    if (iValue >= aThreshold.HIGH) {
                        sColorClass = " labelRisk";
                    }
                    return sColorClass;
                }
                return sColorClass;
            },
            formatDaysToChurnColor: function(iValue) {
                var sColorClass = "";
                if (iValue == "N/A") {return sColorClass;}
                var aThresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                var aThreshold = aThresholds.DAYS_TO_REACT;
                if (iValue < aThreshold.MEDIUM) {
                    sColorClass = " labelRisk";
                }
                return sColorClass;
            },
            filterSearch: function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                FilterService.setFilterValue("SearchQuery", sQuery, this.SearchFilterStorageKey);
                this.filterResultList(sQuery);
                this.updateListHeading();
            },
            filterResultList: function(sQuery) {
                var oModel = this.getView().getModel("viewModel");
                var oDataModel = this.getView().getModel("CRI");

                var sSearchPath = '/SearchParameters(IP_SEARCH_PARAMETER=\'' + encodeURIComponent(sQuery) + '\')/Results';

                oModel.setProperty("/SearchListItems", []);

                if (!sQuery || sQuery.trim() == "") {
                    this.byId("idResultList").bindProperty("noDataText", "Labels>/ResultsTableEmptyQuery");
                    return;
                }

                var oSearchPanel = this.byId("idSearchPanel");
                oSearchPanel.setBusy(true);

                var oUrlParameters = this.getUrlParameters();
                var that = this;
                //Search - IBSO
                oDataModel.read(sSearchPath, {
                    sorters: [
                        new Sorter("SCORE", true)
                    ],
                    success: function(oResponse) {
                        var oFilters = [];
                        oResponse.results.forEach(function (d) {
                            if (d.SOURCE == "Customer") {
                                var iCustomerId = d.RECORD_ID;
                                var oFilter = new Filter("CUST_ID", FilterOperator.EQ, iCustomerId);
                                oFilters.push(oFilter);
                            }
                        });
                        var customerSearchObjects = {};
                        oResponse.results.forEach(function(d){
                            customerSearchObjects[d.RECORD_ID] = d;
                        });
                        if (oFilters.length > 0) {
                            oDataModel.read("/Customer", {
                                filters:oFilters,
                                urlParameters: {
                                    $expand: "KeyValues"
                                },
                                success: function (oData) {
                                    oData.results.forEach(function (d) {
                                        customerSearchObjects[d.KeyValues.results[0].CUST_ID].RISK = d.KeyValues.results[0];
                                    });
                                    try {
                                        var aResults = Object.keys(customerSearchObjects).map(function(itm) { return customerSearchObjects[itm]; });
                                        oModel.setProperty("/SearchListItems", aResults);
                                        that.updateSearchItemList();
                                        that.updateListHeading();
                                        if (aResults.length == 0) {
                                            that.byId("idResultList").bindProperty("noDataText", "Labels>/ResultsTableNoData");
                                        }
                                    } catch (oError) {
                                        ErrorService.raiseGenericError(oError);
                                    } finally {
                                        oSearchPanel.setBusy(false);
                                    }
                                }
                            });
                        } else {
                            try {
                                var aResults = Object.keys(customerSearchObjects).map(function(itm) { return customerSearchObjects[itm]; });
                                oModel.setProperty("/SearchListItems", aResults);
                                that.updateSearchItemList();
                                that.updateListHeading();
                                if (aResults.length == 0) {
                                    that.byId("idResultList").bindProperty("noDataText", "Labels>/ResultsTableNoData");
                                }
                            } catch (oError) {
                                ErrorService.raiseGenericError(oError);
                            } finally {
                                oSearchPanel.setBusy(false);
                            }
                        }
                    },
                    error: function(oError) {
                        ErrorService.raiseGenericError(oError);
                        oSearchPanel.setBusy(false);
                    }
                });
            },
            searchListItemFactory: function(sId, oContext) {
                var isCustomer = this.isCustomer(oContext),
                    sPath = oContext.getPath(),
                    oItemModel = oContext.getModel(),
                    influence = oItemModel.getProperty(sPath + (isCustomer ? "/RISK/INFLUENCE" : "/EventDetail/INFLUENCE")),
                    sIconUri = isCustomer ? "sap-icon://person-placeholder" : "sap-icon://example",
                    sIconColorClass = isCustomer ? " customerIconBackground" : " eventIconBackground",
                    fItemExpandBtnOnPress = isCustomer ? this.onCustomerExpand.bind(this) : this.onEventExpand.bind(this),
                    aName = oItemModel.getProperty(sPath).CONSOLIDATED_NAME.split(":"),
                    sItemName = isCustomer ? "<strong>{CONSOLIDATED_NAME}</strong>" : "<strong>" + aName[1] + "</strong>",
                    sCategory = aName[0],
                    //TODO Get Event Details
                    sItemCategoryId = isCustomer ? "ID: {RECORD_ID}" : "Category: " + sCategory,
                    sItemRiskInfluenceLabel = isCustomer ? "{Labels>/CustomerRiskHeading}" : "{Labels>/EventInfluenceHeading}",
                    iItemRiskInfluence = this.formatRiskValue(influence),
                    sItemRiskInfluenceClass = this.formatRiskColor(influence),
                    sItemImpactIncomeLossLabel = isCustomer ? "{Labels>/CustomerIncomeLossHeading}" : "{Labels>/EventImpactHeading}",
                    iItemImpactIncomeLoss = this.formatExistingValue(oItemModel.getProperty(sPath + (isCustomer ? "/RISK/INCOME_LOSS" : "/EventDetail/EVENT_IMPACT"))),
                    oItemImpactIncomeLoss,
                    sDaysToChurnLabel = "{Labels>/DaysToChurnHeading}",
                    iDaysToChurn = this.formatExistingValue(oItemModel.getProperty(sPath + (isCustomer ? "/RISK/DAYS_TO_REACT" : "/EventDetail/DAYS_TO_REACT"))),
                    sDaysToChurnClass = this.formatExistingValue(iDaysToChurn),
                    fItemMoreInfoBtnOnPress = isCustomer ? this.onCustomerMoreInfoBtn.bind(this) : this.onEventMoreInfoBtn.bind(this),
                    oExpandInfoConfig = isCustomer ? {} : {visible: false, items: [
                        new VBox({items: [
                            new FormattedText({htmlText: "<strong>{Labels>/EventDescriptionHeading}</strong>"})
                                .addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom"),
                            new Text({text: "{CONSOLIDATED_NAME}"})
                                .addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom")
                        ]})
                    ]};

                if (isCustomer) {
                    var sCurrency = oItemModel.getProperty(sPath + "/KeyValues/CURRENCY");
                    if (sCurrency == "N/A") {
                        oItemImpactIncomeLoss = new Text({text: iItemImpactIncomeLoss}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom");
                    } else {
                        oItemImpactIncomeLoss = new ObjectNumber({number: Formatter.number(iItemImpactIncomeLoss, 2, 2), unit: sCurrency})
                            .addStyleClass("sapUiMediumMarginBeginEnd");
                    }
                } else {
                    oItemImpactIncomeLoss = new Text({text: iItemImpactIncomeLoss}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom");
                }
				var aCustomerListItemInfo = [
					new VBox({width: "25%", items: [
                                    new FormattedText({htmlText:sItemName}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop idHeading"),
                                    new Text({text: sItemCategoryId}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom")
                                ]})];
				if (isCustomer) {
				aCustomerListItemInfo.push(
                                new VBox({width: "15%", items: [
                                    new Text({text: sItemRiskInfluenceLabel}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop labelHeading"),
                                    new Text({text: iItemRiskInfluence}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom" + sItemRiskInfluenceClass)
                                ]}).addStyleClass("sapUiMediumMarginEnd"),
                                new VBox({width: "20%", items: [
                                    new Text({text: sItemImpactIncomeLossLabel}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop labelHeading"),
                                    oItemImpactIncomeLoss
                                ]}).addStyleClass("sapUiMediumMarginBegin"));
				} 
                return new CustomListItem({
                    type: "Active",
                    press: fItemExpandBtnOnPress,
                    content: new HBox({items: [
                        new VBox({width: "80px", alignItems: "Center", backgroundDesign: "Solid", items: [
                            new Icon({src: sIconUri, size: "28px", color: "white"}).addStyleClass("sapUiSmallMarginTop")
                        ]}).addStyleClass("sapUiSmallMarginEnd " + sIconColorClass),
                        new VBox({width: "calc(100% - 170px)", items: [
                            new HBox({items: aCustomerListItemInfo
                            // [
                            //     new VBox({width: "25%", items: [
                            //         new FormattedText({htmlText:sItemName}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop idHeading"),
                            //         new Text({text: sItemCategoryId}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom")
                            //     ]}),
                            //     new VBox({width: "15%", items: [
                            //         new Text({text: sItemRiskInfluenceLabel}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop labelHeading"),
                            //         new Text({text: iItemRiskInfluence}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom" + sItemRiskInfluenceClass)
                            //     ]}).addStyleClass("sapUiMediumMarginEnd"),
                            //     new VBox({width: "20%", items: [
                            //         new Text({text: sItemImpactIncomeLossLabel}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop labelHeading"),
                            //         oItemImpactIncomeLoss
                            //     ]}).addStyleClass("sapUiMediumMarginBegin")
                                // ,
                                // new VBox({width: "20%", items: [
                                //     new Text({text: sDaysToChurnLabel}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTop labelHeading"),
                                //     new Text({text: iDaysToChurn}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginBottom" + sDaysToChurnClass)
                                // ]})
                            // ]
                            	
                            }),
                            new HBox(oExpandInfoConfig)
                        ]}).addStyleClass("sapUiSmallMarginBeginEnd"),
                        new VBox({width: "90px", alignItems: "Center", items: [
                            new VBox({items: [
                                new Button({press: fItemMoreInfoBtnOnPress, icon: "sap-icon://navigation-right-arrow", type: "Transparent"})
                            ]})
                        ]}).addStyleClass("sapUiSmallMarginBegin listItemRightBorder sapUiSmallMarginTopBottom")
                    ]}).addStyleClass("listItemBorder")
                }).addStyleClass("sapUiSmallMarginTopBottom");
            },
            getItemFilters: function() {
                var sListId = this.getSelectedTab();
                var sListType;
                var aFilters = [];
                switch (sListId) {
                    case "idConsolidatedList":
                        break;
                    case "idCustomerList":
                        sListType = "Customer";
                        var oCustomerFilter = new sap.ui.model.Filter("SOURCE", sap.ui.model.FilterOperator.EQ, sListType);
                        aFilters.push(oCustomerFilter);
                        break;
                    case "idEventList":
                        sListType = "Event";
                        var oEventFilter = new sap.ui.model.Filter("SOURCE", sap.ui.model.FilterOperator.EQ, sListType);
                        aFilters.push(oEventFilter);
                        break;
                    default:
                        break;
                }
                return aFilters;
            },
            getUrlParameters: function() {
                return {$expand: "KeyValues,EventDetail"};
            },
            getSelectedTab: function() {
                var sListId = this.byId("idTabContainer").getSelectedKey();
                var iBeginningIndex = sListId.lastIndexOf("-") + 1;
                sListId = sListId.slice(iBeginningIndex, sListId.length);
                if (sListId) {
                    return sListId;
                }
                return null;
            },
            isCustomer: function(oContext) {
                var sPath = oContext.sPath;
                var iItemFirstIndex = parseInt(sPath.lastIndexOf("\/") + 1, 10);
                var iItemIndex = sPath.slice(iItemFirstIndex, sPath.length);
                if (oContext.oModel.oData.SearchListItems[iItemIndex].SOURCE == "Customer") {return true;}
                return false;
            },
            onCustomerMoreInfoBtn: function(oEvent) {
                var oContext = oEvent.getSource().getParent().getBindingContext();
                var sCustIdPath = oContext.getPath() + "/RECORD_ID";
                var iCustomerId = oContext.getModel().getProperty(sCustIdPath);

                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNav.toExternal({
                    target: {semanticObject: "CustomerDetails", action: "display"},
                    params: {customerId: iCustomerId}
                });
            },
            onEventMoreInfoBtn: function(oEvent) {
                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNav.toExternal({
                    target: {semanticObject: "EventOverview", action: "display"}
                });
            },
            onCustomerExpand: function(oEvent) {
                var oExpandedInfoBox = oEvent.getSource().getAggregation("content")[0].getAggregation("items")[1].getAggregation("items")[1];
                var oExpandedInfoList = oExpandedInfoBox.getAggregation("items")[0];

                if (!oExpandedInfoList) { // If pulse/event info has not been created, create the info box
                    var oSearchListItem = oEvent.getSource();
                    oSearchListItem.setBusyIndicatorDelay(0);
                    oSearchListItem.setBusy(true);

                    var oContext = oEvent.getSource().getBindingContext();
                    var sCustIdPath = oContext.getPath() + "/RECORD_ID";
                    var sCustomerId = oContext.getModel().getProperty(sCustIdPath).toString();
                    var sPulsePath = "/Customer(" + sCustomerId + ")/Pulse";
                    var oDataModel = this.getView().getModel("CRI");

                    var that = this;
                    var oExpandItem = oExpandedInfoBox;

                    var oSorter = new Sorter("INIT_DATE", true);
                    oDataModel.read(sPulsePath, {
                        sorters: [oSorter],
                        success: function(oResponse) {
                            try {
                                var aResults = oResponse.results;
                                var oInfoBox = that.getCustomerInfoBox(aResults);
                                var aSearchListAggregation = oExpandItem;
                                oInfoBox.forEach(function(oBox) {
                                    aSearchListAggregation.addItem(oBox);
                                });
                            } catch (oError) {
                                ErrorService.raiseGenericError(oError);
                            } finally {
                                oSearchListItem.setBusy(false);
                            }
                        }, error: function(oError) {
                            ErrorService.raiseGenericError(oError);
                            oSearchListItem.setBusy(false);
                        }
                    });
                } else {
                    if (oExpandedInfoList.getVisible()) {
                        oExpandedInfoBox.getAggregation("items").forEach(function(oBox) {
                            oBox.setVisible(false);
                        });
                    } else {
                        oExpandedInfoBox.getAggregation("items").forEach(function(oBox) {
                            oBox.setVisible(true);
                        });
                    }
                }
            },
            getCustomerInfoBox: function(oData) {
                return [
                    new VBox({width: "40%", items: [
                        new Text({text: "{Labels>/LatestActivitiesHeading}"}).addStyleClass("sapUiSmallMarginBegin expandHeading"),
                        new List({items: this.getRecentEventItems(oData)})
                    ]}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom"),
                    new VBox({width: "50%", items: [
                        new Text({text: "{Labels>/CustomerPulseHeading}"}).addStyleClass("sapUiSmallMarginBegin expandHeading"),
                        new PulseChart({items: this.pulseChartItemsFactory(oData), height: "100%", width: "100%",
                            showSimplePulse: true, yAxisLabel: "", thresholdLowValue: this.getRiskThresholdValue("Low"),
                            thresholdHighValue: this.getRiskThresholdValue("Medium"), actionRequiredValue: this.getRiskThresholdValue("High")})
                    ]}).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom")
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
                    var sEventDate = this.formatDate(oEventData.INIT_DATE);
                    var oEventItem = new DisplayListItem({label: sEventName, value: sEventDate}).addStyleClass("sapUiSmallMarginTopBottom");
                    aRecentEvents.push(oEventItem);
                }
                return aRecentEvents;
            },
            formatDate: function(date) {
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();

                return day + ' / ' + month + ' / ' + year;
            },
            onEventExpand: function(oEvent) {
                var oExpandedInfo = oEvent.getSource().getAggregation("content")[0].getAggregation("items")[1]
                    .getAggregation("items")[1];
                if (oExpandedInfo.getVisible()) {
                    oExpandedInfo.setVisible(false);
                } else {
                    oExpandedInfo.setVisible(true);
                }
            },
            onTabSelection: function(oEvent) {
                this.updateSearchItemList();
                this.updateListHeading();
            },
            updateNumItems: function() {
                var oModel = this.getView().getModel("viewModel");
                var iNumCustomers = 0;
                var iNumEvents = 0;
                var oItems = this.getView().getModel("viewModel").getProperty("/SearchListItems");
                var iNumItems = oItems.length;
                oItems.forEach(function(oItem) {
                    if (oItem.SOURCE == "Event") {
                        iNumEvents++;
                    } else {
                        iNumCustomers++;
                    }
                });
                oModel.setProperty("/NumItems", iNumItems);
                oModel.setProperty("/NumCustomers", iNumCustomers);
                oModel.setProperty("/NumEvents", iNumEvents);
            },
            updateListHeading: function() {
                var sSelectedTab;
                var sSelectedTabId = this.getSelectedTab();
                switch (sSelectedTabId) {
                    case "idConsolidatedList":
                        sSelectedTab = "All";
                        break;
                    case "idCustomerList":
                        sSelectedTab = "Customers";
                        break;
                    case "idEventList":
                        sSelectedTab = "Events";
                        break;
                    default:
                        break;
                }
                this.updateNumItems();
                this.getView().getModel("viewModel").setProperty("/SelectedTab", sSelectedTab);
            },
            updateSearchItemList: function() {
                var oBinding = this.byId("idResultList").getBinding("items");
                var aFilters = this.getItemFilters();
                oBinding.filter(aFilters);
            },
            pulseChartItemsFactory: function(oData) {
                var aPulseChartItems = [];
                oData.forEach(function(oDataPoint) {
                    var oItem = new PulseChartItem();
                    oItem.setDateString(oDataPoint.INIT_DATE);
                    oItem.setValue(oDataPoint.INFLUENCE);
                    oItem.setLabel(oDataPoint.EVENT_NAME);
                    aPulseChartItems.push(oItem);
                });
                return aPulseChartItems;
            }
        });
    });