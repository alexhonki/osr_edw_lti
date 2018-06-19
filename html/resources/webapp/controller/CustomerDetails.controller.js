sap.ui.define([
    "sap/fiori/cri/controller/BaseController",
    "sap/fiori/cri/model/formatter",
    "sap/fiori/cri/model/PulseChartItem",
    "sap/fiori/cri/service/Utilities",
    "sap/fiori/cri/service/ErrorService",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/DateFormat"
],
    /**
     * Customer Details Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @param {sap.fiori.cri.model.PulseChartItem} PulseChartItem Pulse Chart Item
     * @param {sap.fiori.cri.service.Utilities} Utilities Utility Service
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.core.format.DateFormat} DateFormat DateFormat
     * @returns {*} Customer Details Controller
     */
function (BaseController, Formatter, PulseChartItem, Utilities, ErrorService, JSONModel, Filter,
             FilterOperator, Sorter, DateFormat) {
    "use strict";
    return BaseController.extend("sap.fiori.cri.controller.CustomerDetails", {
        formatter: Formatter,
        AllCategoriesKey: "ALL CATEGORIES",
        onInit: function () {
            var model = new JSONModel();
            model.setProperty("/dayEventList", []);
            model.setProperty("/EventCategoryFilter", this.AllCategoriesKey);
            model.setProperty("/TimeRangeFilters", [
                {
                    key: 3,
                    text: "3 Months"
                },
                {
                    key: 6,
                    text: "6 Months"
                },
                {
                    key: 12,
                    text: "12 Months"
                },
                {
                    key: 18,
                    text: "18 Months"
                },
                {
                    key: 24,
                    text: "24 Months"
                },
                {
                              key: "2010",
                              text: "2010 Onwards"
                },
                {
                    key: "All",
                    text: "All Time"
                }
            ]);
            model.setProperty("/TimeRangeFilter", "2010");
            this.getView().setModel(model);
        },
        _initChart: function () {
            var oChart = this.byId("idPulseChart");
                                                oChart.setProperty("yAxisLabel", this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("CustomerPulse.Event.Risk"));
            var oContainer = this.byId("idCustomerDetailsPage");
            sap.ui.core.ResizeHandler.register(oContainer, function(){
                oChart.refresh();
            });
 
            var eventTable = this.byId('idCustomerEventsTable');
            eventTable.attachEvent('rowSelectionChange', function (event) {
                if (event.getParameters().userInteraction == false) {
                    return;
                }
 
                var selectedEventPath = event.getParameters().rowContext.getPath();
                var parts = selectedEventPath.split("/");
                var bindingIndex = parts[parts.length - 1];
 
                oChart.selectDataPointAtIndex(bindingIndex);
            });
        },
        onBeforeRendering: function () {
               var i18nModel = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.getView().setModel(new JSONModel({
                EventViewTypes:[
                    {key:"History", value:i18nModel.getText("CustomerDetails.EventTableViewTypeHistory")},
                    {key:"Distinct", value:i18nModel.getText("CustomerDetails.EventTableViewTypeDistinct")}
                ],
                SelectedEventViewType:"History"
            }), "viewModel");
        },
        onAfterRendering: function () {
            var oComponentData = this.getOwnerComponent().getComponentData();
            var customerId = oComponentData.startupParameters.customerId;
 
            if (!customerId || customerId.length != 1) {
                //invalid load
            } else {
                this._initChart();
                this.loadThresholds();
                this.loadDataForId(customerId[0], "");
            }
        },
        loadThresholds: function(thresholds) {
            var givenValidThresholds = (thresholds && thresholds.INFLUENCE && thresholds.INFLUENCE.MEDIUM && thresholds.INFLUENCE.HIGH && thresholds.ACTION_REQUIRED);
            var oThresholds = {
                "MEDIUM_RISK":7,
                "HIGH_RISK":15,
                "ACTION_REQUIRED":20
            };
 
            if (givenValidThresholds) {
                oThresholds.MEDIUM_RISK = thresholds.INFLUENCE.MEDIUM;
                oThresholds.HIGH_RISK = thresholds.INFLUENCE.HIGH;
                oThresholds.ACTION_REQUIRED = thresholds.ACTION_REQUIRED;
            }
 
            this.getView().getModel().setProperty("/Thresholds", oThresholds);
 
            if (givenValidThresholds) { return; }
 
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
 
                        //var actionRequired = oThresholdsById["ACTION_REQUIRED_THRESHOLD"];
                        //oThresholds.ACTION_REQUIRED = parseFloat(actionRequired["1"].FROM_VALUE);
 
                        var risk = oThresholdsById["INFLUENCE"];
                        oThresholds.MEDIUM_RISK = parseFloat(risk["1"].TO_VALUE);
                        oThresholds.HIGH_RISK = parseFloat(risk["2"].TO_VALUE);
 
                        this.getView().getModel().setProperty("/Thresholds", oThresholds);
 
                        this.getView().getModel().refresh(true);
                    } catch (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                }.bind(this),
                error: function (oError) {
                    ErrorService.raiseGenericError(oError);
                }.bind(this)
            });
        },
        loadDataForId: function (customerId, customerName) {
            this.getView().getModel().setProperty("/CustomerId", customerId);
            this.getView().getModel().setProperty("/ExternalCustomerId", "");
            this.getView().getModel().setProperty("/CustomerEvents", []);
            this.getView().getModel().setProperty("/CustomerAttributes", []);
            var oDataModel = this.getView().getModel('CRI');
 
 
            oDataModel.getMetaModel().loaded().then(function () {
                var metaModel = oDataModel.getMetaModel();
                this.getView().setModel(metaModel, "meta");
            }.bind(this));
 
            var timeRange = this.getView().getModel().getProperty("/TimeRangeFilter");
 
            var filters = [];
            if (timeRange != "All") {
                var date = new Date();
                if (timeRange === "2010") {
                    date.setFullYear(2010, 0, 1);
                } else {
                    date.setMonth(date.getMonth() - timeRange);
                }
                filters.push(new Filter("INIT_DATE", FilterOperator.GE, date.getTime()));
            }
 
            this.updatePulse(filters);
 
            var attributesContainer = this.byId("attributesContainer");
            attributesContainer.setBusyIndicatorDelay(0);
            attributesContainer.setBusy(true);
 
            var KVRLoaded, detailsLoaded;
            KVRLoaded = detailsLoaded = false;
 
            var onDone = function () {
                if (KVRLoaded && detailsLoaded) {
                    attributesContainer.setBusy(false);
                }
            };
 
            this.getView().getModel('CRI').read("/Customer(" + customerId + ")", {
                urlParameters: {
                    "$expand": "KeyValues,Reactions"
                },
                success: function (oData) {
                    try {
                        var mapped = [];
 
                        this.getView().getModel().setProperty("/ExternalCustomerId", oData.EXT_ID);
 
                        var reactions = oData.Reactions;
                        if (Array.isArray(reactions.results)) {
                            reactions.results.forEach(function (d) {
                                mapped.push({
                                    StartDate: d.INIT_DATE,
                                    EndDate: d.END_DATE,
                                    ReactionType: d.DESCRIPTION
                                });
                            });
                        } else {
                            mapped.push({
                                StartDate: oData.INIT_DATE,
                                EndDate: oData.END_DATE,
                                ReactionType: reactions.DESCRIPTION
                            });
                        }
 
                        var oKeyValues = oData.KeyValues.results[0] || {};
 
                        this.getView().getModel().setProperty("/CustomerName", oData.NAME);
                        this.getView().getModel().setProperty("/CustomerOIL", oKeyValues.INCOME_LOSS ? parseFloat(oKeyValues.INCOME_LOSS).toFixed(2) : null);
                        this.getView().getModel().setProperty("/Currency", oKeyValues.CURRENCY || null);
                        this.getView().getModel().setProperty("/CustomerRisk", oKeyValues.INFLUENCE ? oKeyValues.INFLUENCE + "%" : "N/A");
                        this.getView().getModel().setProperty("/CustomerDaysToChurn", oKeyValues.DAYS_TO_REACT ? oKeyValues.DAYS_TO_REACT : "N/A");
                        this.getView().getModel().setProperty("/Reactions", mapped);
                    } catch (oError) {
                        ErrorService.raiseGenericError(oError);
                    } finally {
                        KVRLoaded = true;
                        onDone();
                    }
                }.bind(this),
                error: function (oError) {
                    ErrorService.raiseGenericError(oError);
                    KVRLoaded = true;
                    onDone();
                }
            });
 
            this.getView().getModel('CRI').read("/Customer(" + customerId + ")/Details", {
                success: function (oData) {
                    try {
                        var mappedData = [];
 
                        var metaModel = this.getView().getModel("meta");
                        var oPropertyNames = {};
                        var oUnits = {};
 
                        if (metaModel) {
                            //change made LTI, changing namespace to default in the below call
                            var aProperties = metaModel.getProperty('/dataServices/schema/[${namespace}===\'com.odata.v2.sap.cr\']/entityType/[${name}===\'CustomerDetailsType\']/property');
 
                            for (var iPropertyIndex = 0; iPropertyIndex < aProperties.length; iPropertyIndex++) {
                                var oProperty = aProperties[iPropertyIndex];
                                oPropertyNames[oProperty.name] = oProperty["sap:label"] || oProperty["com.sap.vocabularies.Common.v1.Label"] || oProperty;
 
                                var sMaybeUnit = oProperty["Org.OData.Measures.V1.Unit"];
                                if (sMaybeUnit) {
                                    sMaybeUnit = (sMaybeUnit.String ? sMaybeUnit.String : null);
                                }
                                if (!sMaybeUnit) {
                                    sMaybeUnit = oProperty["sap:unit"];
                                }
                                if (sMaybeUnit) {
                                    oUnits[oProperty.name] = sMaybeUnit;
                                }
                            }
                        }
 
                        var excludeAttributes = ["__metadata", "GEN_ID", "Pulse", "NAME"];
 
                        var fields = oData.results;
 
                        for (var iFieldIndex = 0; iFieldIndex < fields.length; iFieldIndex++) {
 
                            var oField = fields[iFieldIndex];
                            var key = oField["FIELD_NAME"];
                            var label = oPropertyNames[key] || oField["FIELD_DESCRIPTION"];
                            var value = oField["FIELD_VALUE"];
 
                            if (excludeAttributes.indexOf(key) != -1 || key.indexOf("_BUCKET") != -1) {
                                continue;
                            }
 
                            var sUnit = oUnits[key];
 
                            if (sUnit) {
                                value = value + " " + sUnit;
                            }
 
                            var transformed = {
                                label: label,
                                text: value
                            };
                                                                                                                if(oField.IS_SHOW_DETAILS > 0){
                                                                                                                                mappedData.push(transformed);
                                                                                                                }
                        }
 
                        this.getView().getModel().setProperty("/CustomerAttributes", mappedData);
                    } catch (oError) {
                        ErrorService.raiseGenericError(oError);
                    } finally {
                        detailsLoaded = true;
                        onDone();
                    }
                }.bind(this),
                error: function (oError) {
                    ErrorService.raiseGenericError(oError);
                    detailsLoaded = true;
                    onDone();
                }
            });
 
            /*
            var similarCustomerContainer = this.byId("idSimilarCustomersTable");
            similarCustomerContainer.setBusyIndicatorDelay(0);
            similarCustomerContainer.setBusy(true);
            this.getView().getModel('CRI').read("/Customer(" + customerId + ")/Similar", {
                urlParameters: {
                    "$expand": "KeyValues"
                },
                success: function (oData) {
                    var model = this.getView().getModel();
                    var similarCustomers = [];
                    oData.results.forEach(function (d) {
                        similarCustomers.push({
                            Name: d['NAME'],
                            Id: d['CUST_ID'],
                            OriginId: d['EXT_ID'],
                            Risk: parseInt(d.KeyValues['INFLUENCE']) + "%",
                            OperatingIncome: d.KeyValues['INCOME_LOSS'],
                            Currency: d.KeyValues['CURRENCY'],
                            DaysToChurn: d.KeyValues['DAYS_TO_REACT'],
                            Similarity: d['SIMILARITY'] + "%"
                        });
                    });
                    model.setProperty("/SimilarCustomers", similarCustomers);
                    similarCustomerContainer.setBusy(false);
                }.bind(this),
                error: function () {
                    similarCustomerContainer.setBusy(false);
                }
            });
            */
        },
        /**
         * Gets the model for the chart. Creates a new model if one does not already exist
         * @returns {sap.ui.model.json.JSONModel} JSONModel for the chart
         */
        getChartModel: function () {
            if (this.oChartModel == null) {
 
                var oChartModel = new JSONModel();
 
                var that = this;
                oChartModel.attachRequestCompleted(function () {
                    that.getView().byId("idCustomerDetailsPage").setBusy(false);
 
                });
                oChartModel.attachRequestFailed(function () {
                    that.getView().byId("idCustomerDetailsPage").setBusy(false);
 
                });
 
                this.oChartModel = oChartModel;
            }
 
            return this.oChartModel;
        },
        reactionItemFactory: function (sId, oContext) {
            var item = new PulseChartItem();
            item.setDateString(oContext.getProperty("StartDate"));
            item.setEndDateString(oContext.getProperty("EndDate"));
            item.setLabel(oContext.getProperty("ReactionType"));
            item.setData(oContext.getProperty());
            item.setBindingContext(oContext);
            return item;
        },
        pulseChartItemsFactory: function (sId, oContext) {
            var item = new PulseChartItem();
            item.setDateString(oContext.getProperty("Date"));
            item.setValue(this.formatter.pulse(oContext.getProperty("Influence")));
            item.setLabel(oContext.getProperty("EventName"));
            item.setData(oContext.getProperty());
            item.setBindingContext(oContext);
            return item;
        },
        onItemSelect: function (oEvent) {
            var items = oEvent.getParameter("items");
            var listItems = [];
            items.forEach(function (d) {
                listItems.push(d.getProperty("data"));
            });
            this.getView().getModel().setProperty("/dayEventList", listItems);
 
            var formattedDate;
            var scrollPosition = 0;
            var scrollDuration = 100;
 
            if (listItems.length > 0 && listItems[0].Date) {
                var dateFormat = DateFormat.getDateTimeInstance({pattern: 'dd MMM yyyy'});
                var date = listItems[0].Date;
                formattedDate = dateFormat.format(date);
                scrollPosition = 999;
                scrollDuration = 1000;
            }
            this.getView().getModel().setProperty("/daySelected", formattedDate);
            this.byId('idCustomerDetailsPage').scrollTo(scrollPosition, scrollDuration);
        },
        onTimeSelection: function (oEvent) {
            var timeRange = this.getView().getModel().getProperty("/TimeRangeFilter");
 
            var timeFilter = [];
            if (timeRange != "All") {
                var date = new Date();
                if (timeRange === "2010") {
                    date.setFullYear(2010, 0, 1);
                } else {
                    date.setMonth(date.getMonth() - timeRange);
                }
                timeFilter.push(new Filter("INIT_DATE", FilterOperator.GE, date.getTime()));
            }
 
            this.updatePulse(timeFilter);
        },
        updatePulse: function (timeFilter) {
            this.getView().getModel().setProperty("/dayEventList", []);
 
            var oContainer = this.byId("idCustomerDetailsPage");
            oContainer.setBusyIndicatorDelay(0);
            oContainer.setBusy(true);
 
            var customerId = this.getView().getModel().getProperty("/CustomerId");
            this.getView().getModel('CRI').read("/Customer(" + customerId + ")/Pulse", {
                filters: timeFilter,
                sorters: [
                    new Sorter("INIT_DATE", true)
                ],
                success: function (oData) {
                    try {
                        var pulse = oData.results;
 
                        var mappedData = [];
                        var categories = [{
                            key: this.AllCategoriesKey,
                            icon: "sap-icon://multiselect-all"}];
                        for (var i = 0; i < pulse.length; i++) {
                            var d = pulse[i];
 
                            var transformed = {
                                Date: d.INIT_DATE,
                                EventGroup: d.EVENT_GROUP,
                                EventName: d.EVENT_NAME,
                                EventDetail: d.EVENT_GROUP + ": " + d.EVENT_NAME,
                                Influence: d.INFLUENCE / 100,
                                Comment: d.DESCRIPTION,
                                Priority: d.PRIORITY,
                                Icon: d.ICON,
                                Visible: true,
                                Data: d
                            };
 
                            var oCategory =  {};
                            if (!categories.some(function(currVal){
                                return currVal.key === d.EVENT_GROUP;
                            }))
                            {
                                oCategory.key = d.EVENT_GROUP;
                                oCategory.icon = d.ICON !== null ? "sap-icon://" + d.ICON : "";
                                categories.push(oCategory);
                            }
 
                            mappedData.push(transformed);
                        }
 
                        this.getView().getModel().setProperty("/CustomerEvents", mappedData);
                        this.getView().getModel().setProperty("/CustomerEventCategories", categories);
 
                        this.showFilteredEvents();
                    } catch (oError) {
                        ErrorService.raiseGenericError(oError);
                    } finally {
                        oContainer.setBusy(false);
                    }
                }.bind(this),
                error: function (oError) {
                    ErrorService.raiseGenericError(oError);
                    oContainer.setBusy(false);
                }
            });
        },
       onCategorySelection: function (oEvent) {
            var sSelectedCategory;
            if (oEvent.getParameter("item")){
                sSelectedCategory = oEvent.getParameter("item").getProperty("text");
            } else if(oEvent.getParameter("selectedItem")){
                sSelectedCategory = oEvent.getParameter("selectedItem").getProperty("key");
            }
            this.getView().getModel().setProperty("/EventCategoryFilter", sSelectedCategory);
            this.showFilteredEvents();
        },
        showFilteredEvents: function () {
            var categoryfilter = this.getView().getModel().getProperty("/EventCategoryFilter");
            var eventList = this.getView().getModel().getProperty("/CustomerEvents");
 
            var filteredList = [];
            if (categoryfilter != this.AllCategoriesKey) {
             /*   eventList.forEach(function (event) {
                    if (event.EventGroup == categoryfilter) {
                        event.Visible = true;
                        filteredList.push(event);
                    } else {
                              event.Visible = false;
                              //filteredList.push(event);
                    }
                });*/
               
               filteredList = eventList.map(function(oEvent){
                              var oNewEvent = jQuery.extend(false,{},oEvent);
                              oNewEvent.Visible = !!(oNewEvent.EventGroup === categoryfilter);
                              return oNewEvent;
               });
                
            } else {
               event.Visible = true;
                filteredList = eventList;
            }
 
            var groups = {};
            filteredList.forEach(function (oItem) {
                var key = oItem.EventGroup + " : " + oItem.EventName;
                var event = groups[key] || oItem;
                var count = event.EventCount || 0;
                var events = event.Events || [];
                events.push(oItem);
                event.EventCount = count + 1;
                event.Events = events;
                groups[key] = event;
            });
 
            var grouped = [];
            for (var key in groups) {
                if (groups.hasOwnProperty(key)) {
                    grouped.push(groups[key]);
                }
            }
            grouped.sort(function(a, b) {
                return b.Influence - a.Influence;
            });
 
            this.getView().getModel().setProperty("/FilteredCustomerEvents", filteredList);
            this.getView().getModel().setProperty("/DistinctCustomerEvents", grouped);
        },
        exportEventList: function (event) {
            var customerId = this.getView().getModel().getProperty("/CustomerId");
            var currentCategory = this.getView().getModel().getProperty("/EventCategoryFilter");
 
            var filters = [];
            if (currentCategory != this.AllCategoriesKey) {
                filters.push(new Filter("EVENT_GROUP", FilterOperator.EQ, currentCategory));
            }
 
            this.getView().getModel('CRI').read("/Customer(" + customerId + ")/Pulse", {
                    sorters: [
                        new Sorter("INIT_DATE", true)
                    ],
                    filters: filters,
                    success: function (oData) {
                        try {
                            var arrayOfData = [
                                ["Event Name", "Event Group", "Risk", "Date"]
                            ];
                            var dateFormat = DateFormat.getDateTimeInstance({pattern: 'dd MMM yyyy'});
 
                            oData.results.forEach(function (entry) {
                                arrayOfData.push([
                                    entry.EVENT_NAME,
                                    entry.EVENT_GROUP,
                                    entry.INFLUENCE,
                                    dateFormat.format(entry.INIT_DATE)
                                ]);
                            });
                            Utilities.saveCSV(arrayOfData, "Customer Event List");
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                }
            );
        },
        exportCustomerList: function (oEvent) {
           /* var table = this.getView().byId("idSimilarCustomersTable");
            var selectedCustomers = table.getSelectedIndices();
            var customersToExport = [];
            selectedCustomers.forEach(function (rowIndex) {
                var context = table.getContextByIndex(rowIndex);
                var data = context.getObject();
                customersToExport.push({
                    CustomerId: data.Id,
                    OriginId: data.OriginId,
                    CustomerName: data.Name,
                    OperatingIncome: data.OperatingIncome,
                    Churned: '',
                    Currency: data.Currency
                });
            });
            this.getOwnerComponent().exportDialog.open(this.getView(), customersToExport); */
        },
        showSimilarCustomer: function (oEvent) {
            var data = oEvent.getSource().getParent().getBindingContext().getObject();
            var customerId = data.Id;
 
            var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
            oCrossAppNav.toExternal({
                target: {semanticObject: "CustomerDetails", action: "display"},
                params: {customerId: customerId}
            });
        },
        onSelectDistinctEvent: function (oEvent) {
            var table = oEvent.getSource();
            var oContext = oEvent.getParameters().rowContext;
 
            var firstRow = table.getFirstVisibleRow();
            var index = table.getSelectedIndex() - firstRow;
            if (index < 0) { return; }
 
            var selectedRow = table.getAggregation("rows")[index];
            var cells = selectedRow.getCells();
            var lastCell = cells[cells.length - 1];
 
            var oData = oContext.getModel().getProperty(oContext.getPath());
 
            var oPopover = this.getDistinctEventPopover();
            oPopover.getModel().setProperty("/Events", oData.Events);
            oPopover.openBy(lastCell);
        },
        getDistinctEventPopover:function () {
            if (!this._distinctEventPopover) {
                this._distinctEventPopover = sap.ui.xmlfragment("sap.fiori.cri.view.DistinctEventPopover", this);
                this._distinctEventPopover.setModel(new JSONModel({
                    "Title": this.getView().getModel("Labels").getProperty("/DistinctEventPopoverTitle")
                }));
            }
            return this._distinctEventPopover;
       },
        formatDate: function (oValue) {
            return this.formatter.stringFromDate(oValue, "dd MMM yyyy");
        },
        onCloseDistinctEventPopover: function () {
          this._distinctEventPopover.close();
        }
    });
});