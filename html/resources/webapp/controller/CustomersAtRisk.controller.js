//noinspection JSValidateJSDoc
jQuery.sap.require("sap.m.MessageBox");
sap.ui.define([
    "sap/fiori/cri/controller/BaseController",
    "sap/fiori/cri/service/FilterService",
    "sap/fiori/cri/service/Utilities",
    "sap/fiori/cri/service/ErrorService",
    "sap/fiori/cri/model/formatter",
    "sap/ui/model/odata/ODataUtils",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/m/ValueColor"
    ],
    /**
     * Customers At Risk Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.FilterService} FilterService Filter Service
     * @param {sap.fiori.cri.service.Utilities} Utilities Utility Service
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.fiori.cri.model.formatter} formatter Formatter
     * @param {sap.ui.model.odata.ODataUtils} ODataUtils OData Utilities
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.ui.core.format.NumberFormat} NumberFormat NumberFormat
     * @param {sap.ui.Device} Device Device
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @param {sap.m.ValueColor} ValueColor ValueColor
     * @returns {*} Customers At Risk Controller
     */
    function (BaseController, FilterService, Utilities, ErrorService, formatter, ODataUtils, JSONModel, Sorter, Filter,
    FilterOperator, NumberFormat, Device, MessageBox, ValueColor) {
        "use strict";

        //noinspection JSValidateJSDoc
        return BaseController.extend("sap.fiori.cri.controller.CustomersAtRisk", {
            formatter: formatter,
            oVisualFilterTitles: {
                CUSTOMER_RISK: "Customers by Risk",
                INCOME_LOSS: "Customers by Operating Income",
                DAYS_TO_REACT: "Customers by Days To Churn"
            },
            aVisualFilterOrder: ["CUSTOMER_RISK", "INCOME_LOSS", "DAYS_TO_REACT"],
            oBucketColor: {
                low:"rgb(39,163,221)",
                medium: "rgb(248,172,31)",
                high: "rgb(220,13,14)"
            },
            Color: {
            	Neutral: "rgb(39,163,221)",
                Error: "rgb(248,172,31)",
                Critical: "rgb(220,13,14)"
            },
            VisualFilterStorageKey: "CustomersAtRiskVisualFilters",
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel();
                this.getView().setModel(oJSONModel, "viewModel");

                oJSONModel.setProperty("/SuggestedCustomerCount", 10);
                oJSONModel.setProperty("/CustomerPulse", {"254917322":[{x:0,y:0},{x:10, y:100}, {x:20,y:20}, {x:100,y:50}]});
                oJSONModel.setProperty("/HasSelectedCustomers", false);
                oJSONModel.setProperty("/HybrisEnabled", false);
            },
            onBeforeRendering: function () {
                var model = this.getView().getModel("viewModel");
            },
            onAfterRendering: function () {
                this.byId("idExportSuggestedCustomers").setVisible(Device.system.desktop);
                this.byId("idExportAllCustomers").setVisible(Device.system.desktop);
                this.updateFilters();
            },
            onFilterChanged: function (oEvent) {
                this.updateFilters();
            },
            onClearFilters: function (oEvent) {
                FilterService.resetFilterData(this.VisualFilterStorageKey);
                this.updateFilters();
            },
            onRowSelectionChange: function () {
                var table = this.getView().byId("idCustomerListTable");
                var numSelectedRows = table.getSelectedIndices().length;
                this.getView().getModel("viewModel").setProperty("/SelectedRowCount", numSelectedRows);
            },
            onSelectVisualFilter: function (event) {
                var selectedFilter =  event.getParameters().item;
                var viewModel = selectedFilter.getBindingContext("viewModel");
                var bucketId = viewModel.getProperty("BUCKET_ID");

                var value = {
                    Id: viewModel.getProperty("BUCKET_SEQ"),
                    From: viewModel.getProperty("FROM_VALUE"),
                    To: viewModel.getProperty("TO_VALUE")
                };

                this.updateVisualFilterSelection(bucketId, value);
            },
            onDeselectVisualFilter: function (event) {
                var selectedFilter =  event.getParameters().item;
                var bucketId = selectedFilter.getBindingContext("viewModel").getProperty("BUCKET_ID");
                this.updateVisualFilterSelection(bucketId, null);
            },
            onUpdateSuggestedCustomerLimit: function () {
               this.applyFilters();
            },
            updateVisualFilterSelection: function(sBucketId, oValue) {
                FilterService.setFilterValue(sBucketId, oValue, this.VisualFilterStorageKey);

                this.applyFilters();
            },
            updateFilters: function () {
                this.updateVisualFilters();
                this.applyFilters();
            },
            updateVisualFilters: function () {

                var sFilterString = FilterService.getFilterString() || "";

                this.byId('idVisualFilters').setBusyIndicatorDelay(0);
                this.byId('idVisualFilters').setBusy(true);

                this.getView().getModel('viewModel').setProperty("/VisualFilters", null);

                this.getView().getModel("CRI").read("/AtRiskCustomerBucketsParameters(IP_FILTER='" + encodeURIComponent(sFilterString) + "')/Results", {
                    success: function (oData) {
                        try {
                            this.byId('idVisualFilters').setBusy(false);
                            var oVisualFiltersById = {};

                            oData.results.forEach(function (oItem) {
                                var id = oItem["BUCKET_ID"];
                                var items = oVisualFiltersById[id] || [];
                                items.push(oItem);
                                oVisualFiltersById[id] = items;
                            });

                            var oVisualFilters = {};

                            this.aVisualFilterOrder.forEach(function (sKey) {

                                var selectedItem = FilterService.getFilterValue(sKey, this.VisualFilterStorageKey);

                                if (selectedItem) {
                                    // Get actual item from list
                                    oVisualFiltersById[sKey].forEach(function (oItem) {
                                        if (oItem.BUCKET_SEQ == selectedItem.Id) {
                                            selectedItem = oItem;
                                        }
                                    });
                                }

                                if (oVisualFiltersById.hasOwnProperty(sKey)) {
                                    oVisualFilters[sKey] = {id:sKey, title:this.oVisualFilterTitles[sKey], selectedItem:selectedItem, items:oVisualFiltersById[sKey].sort(function (oItem1, oItem2) {
                                        if (sKey == "DAYS_TO_REACT") {
                                            return oItem1.BUCKET_SEQ < oItem2.BUCKET_SEQ ? -1 : 1;
                                        }
                                        return oItem1.BUCKET_SEQ < oItem2.BUCKET_SEQ ? 1 : -1;
                                    })};
                                }
                            }.bind(this));

                            this.getView().getModel('viewModel').setProperty("/VisualFilters", oVisualFilters);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }

                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        this.byId('idVisualFilters').setBusy(false);
                    }.bind(this)
                });
            },
            applyFilters: function () {
                var sFilterString = FilterService.getFilterString() || "";
                var oJSONModel = this.getView().getModel("viewModel");
                var aODataFilters = this.getODataFilters();

                var oSuggestedCustomerItemTemplate = this.getView().byId("idSuggestedCustomerItemTemplate");

                var oSuggestedCustomerListBinding = {
                    path: "CRI>" + this.getSuggestedCustomersEndpoint(sFilterString),
                    sorter: new Sorter("INFLUENCE", true),
                    filters: aODataFilters,
                    length:oJSONModel.getProperty("/SuggestedCustomerCount"),
                    template: oSuggestedCustomerItemTemplate
                };

                this.updateThresholds(function () {
                    this.updateSuggestedCustomerList(oSuggestedCustomerListBinding);
                }.bind(this));

                this.updateCustomerList("CRI>" + this.getCustomersEndpoint(sFilterString)).filter(aODataFilters);
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
                        try {
                            var oThresholdsById = {};

                            oData.results[0]['Config'].results.forEach(function (oItem) {
                                var id = oItem["BUCKET_ID"];
                                var seq = oItem["SEQ"];
                                var items = oThresholdsById[id] || {};
                                items[seq] = oItem;
                                oThresholdsById[id] = items;
                            });

                            var oThresholds = this.getView().getModel('viewModel').getProperty("/Thresholds") || {"CUSTOMER_RISK":{},"DAYS_TO_REACT":{}};

                            var risk = oThresholdsById["CUSTOMER_RISK"];
                            oThresholds.CUSTOMER_RISK = {
                                LOW:parseFloat(risk["1"].FROM_VALUE),
                                MEDIUM:parseFloat(risk["1"].TO_VALUE),
                                HIGH:parseFloat(risk["3"].FROM_VALUE),
                                MAX:parseFloat(risk["3"].TO_VALUE)
                            };


                           /* var daysToChurn = oThresholdsById["DAYS_TO_REACT"];
                            oThresholds.DAYS_TO_REACT = {
                                LOW:parseFloat(daysToChurn["1"].FROM_VALUE),
                                MEDIUM:parseFloat(daysToChurn["1"].TO_VALUE),
                                HIGH:parseFloat(daysToChurn["3"].FROM_VALUE),
                                MAX:parseFloat(daysToChurn["3"].TO_VALUE)
                            };*/

                            this.getView().getModel('viewModel').setProperty("/Thresholds", oThresholds);

                            if (fnCompletion) { fnCompletion(oThresholds); }
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }

                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        this.byId('idVisualFilters').setBusy(false);
                        if (fnCompletion) { fnCompletion(null); }
                    }.bind(this)
                });
            },
            updateSuggestedCustomerList: function(sBinding) {
                var customerTable = this.byId('idSuggestedCustomersTable');
                customerTable.setBusyIndicatorDelay(0);

                if (!this.fnSuggestedCustomerTableBindingDataRequested) {
                    this.fnSuggestedCustomerTableBindingDataRequested = function fnCustomerTableBindingDataRequested() {
                        if (!customerTable.getBusy()) { // Only if the customers table is not already busy
                            customerTable.setBusy(true);
                            customerTable.setShowNoData(false);
                        }
                    };
                }

                if (!this.fnSuggestedCustomerTableBindingDataReceived) {
                    this.fnSuggestedCustomerTableBindingDataReceived = function fnCustomerTableBindingDataReceived(oEvent) {
                        if (oEvent.getParameters().data) {
                        	if(oEvent.getParameters().data.results && oEvent.getParameters().data.results.length >0){
                        		this.getView().getModel('viewModel').setProperty("/Annual_liability_show",oEvent.getParameters().data.results[0].IS_SHOW_DETAILS );
                        	}
                            customerTable.setBusy(false);
                            customerTable.setShowNoData(true);
                        }
                    };
                }

                this.updateBinding('idSuggestedCustomersTable', 'items', sBinding, this.fnSuggestedCustomerTableBindingDataRequested, this.fnSuggestedCustomerTableBindingDataReceived);
            },
            updateCustomerList: function(sBinding) {
                var customerTable = this.byId('idCustomerListTable');
                customerTable.setBusyIndicatorDelay(0);

                if (!this.fnCustomerTableBindingDataRequested) {
                    this.fnCustomerTableBindingDataRequested = function fnCustomerTableBindingDataRequested() {
                        customerTable.setBusy(true);
                        customerTable.setShowNoData(false);
                    };
                }

                if (!this.fnCustomerTableBindingDataReceived) {
                    this.fnCustomerTableBindingDataReceived = function fnCustomerTableBindingDataReceived(oEvent) {
                        if (oEvent.getParameters().data) {
                        	if(oEvent.getParameters().data.results && oEvent.getParameters().data.results.length >0){
                        		this.getView().getModel('viewModel').setProperty("/Annual_liability_show",oEvent.getParameters().data.results[0].IS_SHOW_DETAILS );
                        	}
                            customerTable.setBusy(false);
                            customerTable.setShowNoData(true);
                        }
                    };
                }

                return this.updateBinding('idCustomerListTable', 'rows', sBinding, this.fnCustomerTableBindingDataRequested, this.fnCustomerTableBindingDataReceived);
            },
            updateBinding: function (oControlId, sBindingName, oBindingData, fnDataRequested, fnDataReceived) {

                var oControl = this.byId(oControlId);
                var oBinding = oControl.getBinding(sBindingName);

                if (oBindingData) {
                    oBinding.abortPendingRequest();
                }

                oBinding.detachDataRequested(fnDataRequested, this);
                oBinding.detachDataReceived(fnDataReceived, this);

                if (oBindingData) {
                    oControl.bindAggregation(sBindingName, oBindingData);
                }
                oBinding = oControl.getBinding(sBindingName);

                fnDataRequested();

                oBinding.attachDataRequested(fnDataRequested, this);
                oBinding.attachDataReceived(fnDataReceived, this);

                return oBinding;
            },

            getCustomerSearchFilterODataString: function() {
                var sCustomerName = this.getCustomerSearchFilterValue();
                var sODataString = "";
                if(sCustomerName) {
                    var sEncodedName = "'" + sCustomerName.toLowerCase() + "'";
                    sODataString = "?$filter=substringof(tolower(NAME)," + sEncodedName + ")";
                }
                return sODataString;
            },

            getCustomerSearchFilterValue: function() {
                var oFilterKeys = FilterService.getFilterConfig().filterKeys;
                var sSearchValue = FilterService.getFilterValue(oFilterKeys.customerSearchQuery);
                var oFilterBar = this.byId("idFilterBar").oFilterBar;
                var aFilterItems = oFilterBar.getFilterItems();
                var oFilterItem;
                for(var i = 0; i < aFilterItems.length; i++) {
                    if(aFilterItems[i].getName() == oFilterKeys.customerSearchQuery) {
                        oFilterItem = aFilterItems[i];
                        break;
                    }
                }
                if(oFilterItem) {
                    var oControl = oFilterBar.determineControlByFilterItem(oFilterItem);
                    sSearchValue = oControl.getProperty("value");
                }
                return sSearchValue;
            },
            getODataFilters: function () {
                var aODataFilters = [];

                var visualFilters = FilterService.getFilterData(this.VisualFilterStorageKey);

                for (var filter in visualFilters) {
                    if (visualFilters.hasOwnProperty(filter) && visualFilters[filter] != null) {
                        var filterValue = visualFilters[filter];
                        if (filter == "DAYS_TO_REACT") { filter = "DAYS_TO_REACT"; }
                        if (filter == "CUSTOMER_RISK") { filter = "INFLUENCE"; }
                        var fromFilter = new Filter(filter, FilterOperator.GE, filterValue.From);
                        var toFilter = new Filter(filter, FilterOperator.LE, filterValue.To);
                        var combinedFilter = new Filter({filters: [fromFilter, toFilter], and: true});
                        aODataFilters.push(combinedFilter);
                    }
                }

                var sCustomerName = this.getCustomerSearchFilterValue();
                if(sCustomerName) {
                    var sEncodedFilterString = "'" + sCustomerName.toLowerCase() + "'";
                    var oSearchFilter = new Filter("tolower(NAME)", FilterOperator.Contains, sEncodedFilterString);
                    aODataFilters.push(oSearchFilter);
                }

                if (aODataFilters.length > 0) {
                    return [new Filter({filters:aODataFilters, and:true})];
                }

                return aODataFilters;
            },
            showCustomerPulse: function (event) {
                var context = event.getSource().getParent().getBindingContext('CRI');
                var custIdPath = context.getPath() + "/CUST_ID";
                var customerId = context.getModel().getProperty(custIdPath);

                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNav.toExternal({
                    target: {semanticObject: "CustomerDetails", action: "display"},
                    params: {customerId: customerId}
                });
            },
            showAssign: function () {
                var table = this.getView().byId("idCustomerListTable");
                var customerList = table.getSelectedIndices();
                var customerListData = [];
                customerList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel('CRI').getProperty(context.getPath());
                    customerListData.push({
                        CustomerId: model["CUST_ID"],
                        CustomerName: model["NAME"],
                        Risk: model["INFLUENCE"],
                        DaysToChurn: model["DAYS_TO_REACT"],
                        OperatingIncome: model["INCOME_LOSS"]
                    });
                });

                this.getOwnerComponent().assignCustomersDialog.open(this.getView(), customerListData);
                table.clearSelection();
            },
            updateCustomerSelection: function (event) {
                var table = this.getView().byId("idSuggestedCustomersTable");
                var selectedCustomers = table.getSelectedItems();
                this.getView().getModel("viewModel").setProperty("/HasSelectedCustomers", selectedCustomers.length > 0);
            },
            exportSuggestedCustomerList: function (event) {
                var table = this.getView().byId("idSuggestedCustomersTable");
                var selectedCustomers = table.getSelectedItems();
                var exportCustomers = [];
                if(selectedCustomers.length < 1){
                	return;
                }
                selectedCustomers.forEach(function (row) {
                    var data = row.getBindingContext("CRI").getObject();
                    exportCustomers.push({
                        CustomerId: data.CUST_ID,
                        OriginId: data.EXT_ID,
                        CustomerName: data.NAME,
                        OperatingIncome: data.INCOME_LOSS,
                        Churned: data.CHURNED_FLAG ? "Yes" : "No",
                        Currency: data.CURRENCY,
                        Risk : data.INFLUENCE,
                        AnnualLiability: data.ANNUAL_LIABILITY
                    });
                });
                this.getOwnerComponent().exportDialog.open(this.getView(), exportCustomers,false);
            },
            exportAtRiskCustomerList: function (event) {
                var table = this.getView().byId("idCustomerListTable");
                var tableQuery = table.getBinding().getPath();
                var that = this;
                var aFilter = [],
					aOdataFilter = [];
				var sCustomerFilterString = this.getView().byId("idCustomerSearch").getValue().toUpperCase();
					if (sCustomerFilterString) {
						//build odata filters to be applied
						aFilter = [new Filter("NAME", FilterOperator.Contains, sCustomerFilterString)];

						if (!isNaN(sCustomerFilterString)) {
							aFilter.push(new Filter("CUST_ID", FilterOperator.EQ, sCustomerFilterString));
						}

						aOdataFilter = [new Filter(aFilter, false)];
					}
                table.setBusy(true);
                this.getView().getModel("CRI").read(tableQuery, {
                	filters: aOdataFilter,
                    success: function (oData) {
                        try {
                            table.setBusy(false);
                            var customersToExport = [];

                            oData.results.forEach(function (data) {
                                customersToExport.push({
                                    CustomerId: data.CUST_ID,
                                    OriginId: data.EXT_ID,
                                    CustomerName: data.NAME,
                                    OperatingIncome: data.INCOME_LOSS,
                                    Churned: data.CHURNED_FLAG ? "Yes" : "No",
                                    Currency: data.CURRENCY,
                                    Risk : data.INFLUENCE,
                                    AnnualLiability: data.ANNUAL_LIABILITY
                                });
                            });

                            that.getOwnerComponent().exportDialog.open(that.getView(), customersToExport,false);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oData) {
                        table.setBusy(false);
                        MessageBox.show(
                            "Cannot export at this time.", {
                                icon: MessageBox.Icon.ERROR,
                                title: "Error",
                                actions: [MessageBox.Action.OK]
                            }
                        );
                    }
                });
            },
            formatNumericContent: function(value) {
                var formatNumber = NumberFormat.getFloatInstance({
                    style : 'short',
                    minFractionDigits: 0,
                    maxFractionDigits: 1
                });

                var number = Number(value);
                if (!number) {
                    return "-";
                }

                return formatNumber.format(number);
            },
            formatValueColor: function (value) {
                if (value && value > 0) {
                    return ValueColor.Error;
                }

                return ValueColor.Neutral;
            },
            formatRiskColor: function (value) {
                var thresholds = this.getView().getModel("viewModel").getProperty("/Thresholds");
                if (!thresholds) { return "Error"; }

                var threshold = thresholds.CUSTOMER_RISK;

                if (value <= threshold.MEDIUM) {
                    return this.Color.Neutral;
                } else if (value < threshold.HIGH) {
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
            bucketColorFormatter: function (iBucketIndex) {
                switch (iBucketIndex) {
                    case 3: return this.oBucketColor.high;
                    case 2: return this.oBucketColor.medium;
                    case 1:
                    default:
                        return this.oBucketColor.low;
                }
            },
            getCustomersEndpoint: function (sFilters) {
                return "/AtRiskCustomersParameters(" + this.getInputParameterString(sFilters) + ")/Results";
            },
            getSuggestedCustomersEndpoint: function (sFilters) {
                return "/AtRiskCustomersParameters(" + this.getInputParameterString(sFilters) + ")/Results";
            },
            getInputParameterString: function (sFilters, iBucketSize) {
                var filters = sFilters ? encodeURIComponent(sFilters) : "";
                return "IP_FILTER='" + filters + "'";
            },
            
            filterCustomers : function(oEvent) {
                var sQuery = oEvent.getParameter("query").toUpperCase();
                var filter = null;
                if (sQuery) {
                    var filterArray = [new Filter("NAME", FilterOperator.Contains, sQuery)];

                    if (!isNaN(sQuery)){
                        filterArray.push(new Filter("CUST_ID", FilterOperator.EQ, sQuery));
                    }

                    filter = new Filter(filterArray, false);
                }

                var oTable = this.getView().byId("idCustomerListTable");
                oTable.setBusyIndicatorDelay(0);
                oTable.setBusy(true);

                var oBinding = oTable.getBinding("rows");
                oBinding.attachDataReceived(function () {
                    oTable.setBusy(false);
                    oBinding.detachDataReceived(this);
                });

                oBinding.filter(filter, "Application");
	
            }
        });
    });