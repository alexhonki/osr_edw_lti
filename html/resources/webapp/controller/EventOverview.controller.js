sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/model/formatter",
        "sap/fiori/cri/service/Utilities",
        'sap/fiori/cri/control/VisualFilterPlotItem',
        "sap/fiori/cri/service/FilterService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/core/format/NumberFormat",
        "sap/ui/core/format/DateFormat",
        "sap/ui/Device",
    	"sap/fiori/cri/service/ErrorService"
    ],
    /**
     * Event Overview Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController - BaseController
     * @param {sap.fiori.cri.model.formatter} formatter - formatter
     * @param {sap.fiori.cri.service.Utilities} Utilities - Utilities
     * @param {sap.fiori.cri.control.VisualFilterPlotItem} VisualFilterPlotItem - VisualFilterPlotItem
     * @param {sap.fiori.cri.service.FilterService} FilterService - FilterService
     * @param {sap.ui.model.json.JSONModel} JSONModel - JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator Filter Operator
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.core.format.NumberFormat} NumberFormat Number Format
     * @param {sap.ui.core.format.DateFormat} DateFormat - DateFormat
     * @param {sap.ui.Device} Device Device
     * @returns {sap.fiori.cri.controller.BaseController} BaseController Controller
     */
    function (BaseController, formatter, Utilities, VisualFilterPlotItem, FilterService, JSONModel,
    Filter, FilterOperator, Sorter, NumberFormat, DateFormat, Device,ErrorService) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.EventOverview", {
            formatter: formatter,
            oBubbleChartFields: {
                x: "IMPACT",
                y: "INFLUENCE"
            },
            oVisualFilterTitles: {
                INFLUENCE: "Events by Risk",
                IMPACT: "Events by Impact",
                DAYS_TO_REACT: "Events by Days to Churn"
            },
            aVisualFilterOrder: ["INFLUENCE", "IMPACT", "DAYS_TO_REACT"],
            oBucketColor: {
                low:"rgb(39,163,221)",
                medium: "rgb(248,172,31)",
                high: "rgb(220,13,14)"
            },
            AllCategoriesKey: "ALL CATEGORIES",
            EventSelectionStorageKey: "EventAnalysisEventSelection",
            /**
             * JSONModel is created, and /Events and /DisplayedEvents are set
             * to empty arrays. View Model is also created.
             */
            onInit: function () {
                var oModel = new JSONModel();
                oModel.setProperty("/Events", []);
                oModel.setProperty("/DisplayedEvents", []);
                this.getView().setModel(oModel);

                var oJSONModel = new JSONModel();
                this.getView().setModel(oJSONModel, "viewModel");
                 
            },
            /**
             * Handler for before rendering the control
             */
            onBeforeRendering: function () {
				
            },
            /**
             * Handler for after rendering the control
             */
            onAfterRendering: function () {
            	// Only show export options on desktop
                this.byId("idExportCustomers").setVisible(Device.system.desktop);
                this.byId("idExportEvents").setVisible(Device.system.desktop);

                var oEventOverviewPage = this.byId("idEventOverviewPage");
                oEventOverviewPage.setBusyIndicatorDelay(0);
                oEventOverviewPage.setBusy(true);

                FilterService.setFilterValue("EventGroup", this.AllCategoriesKey, this.EventSelectionStorageKey);
            	var sToDate;
            	var oFilters ;//= this.getODataFilters();
                var filterString ;//= FilterService.getEncodedFilterString() || "";
				var model = this.getView().getModel("CRI");
				 var that = this;
                var oModel = this.getView().getModel();
                var sDateRangeFilters;// = this.getDateRangeFilterString();
	            //set default filter toDate from admin prediction settings
				model.read("/ConfigPredictionDate", {
	                    success: function (oData) {
	                        try {
	                            oData.results.forEach(function (dateSetting) {
	                                if (dateSetting.IS_ENABLED === 1) {
	                                    
	                                     sToDate = dateSetting.TO_TIME_SEGMENT.toString() ;
	                                     FilterService.setDefaultToDate(sToDate); 
	                                     oFilters = that.getODataFilters();
	                                     sDateRangeFilters = that.getDateRangeFilterString();
	                                     filterString = FilterService.getEncodedFilterString() || "";
					                     model.read("/EventOverviewParameters(" + sDateRangeFilters + ",IP_FILTER='" + filterString + "')/Results", {
						                    filters:oFilters,
						                    success: function (oData) {
						                        oModel.setSizeLimit(oData.results.length);
						                        oModel.setProperty("/Events", oData.results);
						                        oModel.setProperty("/DisplayedEvents", oData.results);
						                        that.updateEventCategories();
						                        that.getView().getModel("viewModel").setProperty("/EventGroup", that.AllCategoriesKey);
						
						                        oEventOverviewPage.setBusy(false);
						                    }, error: function () {}
						                });
						                 // OData call to obtain FilterBar resources
						                model.read("/UseCaseConfig", {
						                    filters: [new Filter("IS_ENABLED",FilterOperator.EQ, 1)],
						                    urlParameters: {
						                        $expand:"Config"
						                    },
						                    success: function (oData) {
						                        var useCases = oData.results;
						                        if (useCases.length == 0) {
						                            return;
						                        }
						                        var configItems = useCases[0].Config.results;
						                        var impactThresholds = {};
						                        var riskThresholds = {};
						                        that.getVisualFilterData(configItems);
						                        configItems.forEach(function (oItem) {
						                            if (oItem.BUCKET_ID == "IMPACT") {
						                                impactThresholds[oItem.SEQ] = oItem.FROM_VALUE;
						                            } else if (oItem.BUCKET_ID == "INFLUENCE") {
						                                riskThresholds[oItem.SEQ] = oItem.FROM_VALUE;
						                            }
						                        });
						                        var bubbleChart = that.byId('idVisualFilterBubbleChart');
						
						                        var xAxisThresholds = [impactThresholds["1"], impactThresholds["2"], impactThresholds["3"]];
						                        var yAxisThresholds = [riskThresholds["1"], riskThresholds["2"], riskThresholds["3"]];
						
						                        bubbleChart.setProperty("xAxisThresholds", xAxisThresholds);
						                        bubbleChart.setProperty("yAxisThresholds", yAxisThresholds);
						                        bubbleChart.redraw();
						                    }
						                });
	                                }
	                            });
	                        } catch (oError) {
	                            ErrorService.raiseGenericError(oError);
	                        }
	                    },
	                    error: function (oError) {
	                        ErrorService.raiseGenericError(oError);
	                    }
	            });
                

                // Initial call to obtain data and insert into /Events and /DisplayedEvents
               // var oFilters = this.getODataFilters();
                //var filterString = FilterService.getEncodedFilterString() || "";
               
                //var model = this.getView().getModel("CRI");
                
               
                
               
                this.initBubbleChart();
                this.updateEventsList();
                this.updateTopEvents();
            },
            /**
             * Obtains date range filter string
             * @returns {string} filter string for OData calls
             */
            getDateRangeFilterString: function () {
                var fromDate = FilterService.getFilterValue("IP_FROM") || '';
                var toDate = FilterService.getFilterValue("IP_TO") || '';
                return 'IP_FROM=\'' + fromDate +'\'' + ',IP_TO=\'' + toDate +'\'';
            },
            /**
             * Sets the ranges for Visual Filters
             * @param {*} oData - Config items for Visual Filters
             */
            getVisualFilterData: function (oData) {
                var visualFilterRanges = [];
                oData.forEach(function (filterRange){
                    if ( filterRange.BUCKET_ID == "DAYS_TO_REACT"
                        || filterRange.BUCKET_ID == "INFLUENCE"
                        || filterRange.BUCKET_ID == "IMPACT"){
                        visualFilterRanges.push(filterRange);
                    }
                });
                this.getView().getModel().setProperty('/visualFilterRange', visualFilterRanges);
                this.updateVisualFilters();
            },
            /**
             * Updates Visual Filter values
             */
            updateVisualFilters: function () {
                var visualFilterRange = this.getView().getModel().getProperty('/visualFilterRange');
                var totalEvents = this.getView().getModel().getProperty('/DisplayedEvents');
                var visualFilterRangeObjects = [];
                var influenceObjects = [];
                var impactObjects = [];
                var daysToChurnObjects = [];
                visualFilterRange.forEach(function (filter) {
                    filter.EVENT_COUNTER = 0;
                    filter.BUCKET = filter.DESCRIPTION;

                    switch (filter.BUCKET_ID) {
                        case "INFLUENCE":
                            influenceObjects.push(filter);
                            break;
                        case "IMPACT":
                            impactObjects.push(filter);
                            break;
                        case "DAYS_TO_REACT":
                            daysToChurnObjects.push(filter);
                            break;
                    }
                });
                influenceObjects.sort(this.sortFilters);
                impactObjects.sort(this.sortFilters);
                visualFilterRangeObjects.push({
                    id : "INFLUENCE",
                    title: "Events by Risk",
                    items: influenceObjects,
                    selectedItem: undefined
                });
                visualFilterRangeObjects.push({
                    id : "IMPACT",
                    title: "Events by Impact",
                    items: impactObjects,
                    selectedItem: undefined
                });
                visualFilterRangeObjects.push({
                    id : "DAYS_TO_REACT",
                    title: "Events by Days to Churn",
                    items: daysToChurnObjects,
                    selectedItem: undefined
                });
                totalEvents.forEach(function (event) {
                    visualFilterRangeObjects.forEach(function (filterRangeGroup) {
                        for (var i = 0; i < filterRangeGroup.items.length; i++) {
                            var group = filterRangeGroup.items[i].BUCKET_ID;
                            var fromValue = filterRangeGroup.items[i].FROM_VALUE;
                            var toValue = filterRangeGroup.items[i].TO_VALUE;
                            if (event[group] > fromValue && event[group] <= toValue){
                                filterRangeGroup.items[i].EVENT_COUNTER ++;
                                break;
                            }
                        }
                    });
                });
                this.getView().getModel('viewModel').setProperty("/VisualFilters", visualFilterRangeObjects);
            },
            /**
             * Handles selecting Visual Filters
             * @param {*} event - The click event on the chart
             */
            onSelectVisualFilter: function (event) {
                this.selectEventCategory();
                this.deselectEvent();
                var selectedFilters = this.getView().getModel("viewModel").getProperty("/selectedVisualFilters");
                var events = this.getView().getModel().getProperty('/DisplayedEvents');
                if (event) {
                    var selectedFilter = event.getParameters().item;
                    var group = selectedFilter.getBindingContext("viewModel").getProperty("BUCKET_ID");
                    var fromValue = parseInt(selectedFilter.getBindingContext("viewModel").getProperty("FROM_VALUE"));
                    var toValue = parseInt(selectedFilter.getBindingContext("viewModel").getProperty("TO_VALUE"));
                    var selectedVisualFilter = {
                        group: group,
                        fromValue: fromValue,
                        toValue: toValue
                    };
                    if (selectedFilters) {
                        var foundFilter = false;
                        selectedFilters.forEach(function (filter) {
                            if (filter.group == group) {
                                selectedFilters[selectedFilters.indexOf(filter)] = selectedVisualFilter;
                                foundFilter = true;
                            }
                        });
                        if (!foundFilter) {
                            selectedFilters.push(selectedVisualFilter);
                        }
                    } else { selectedFilters = [selectedVisualFilter]; }
                }
                selectedFilters.forEach(function (filter){
                    events = events.filter(function (event) {
                        if (event[filter.group] > filter.fromValue && event[filter.group] <= filter.toValue){
                            return true;
                        }
                        return false;
                    });
                });
                this.getView().getModel("viewModel").setProperty("/selectedVisualFilters", selectedFilters);
                this.getView().getModel().setProperty('/DisplayedEvents', events);
            },
            /**
             * Handles de-selecting of Visual Filters
             * @param {*} event - The click event on the chart
             */
            onDeselectVisualFilter: function (event) {
                this.deselectEvent();
                if (!event) {
                    this.getView().getModel("viewModel").setProperty("/selectedVisualFilters", null);
                    return;
                }
                var selectedFilter = event.getParameters().item;
                var group = selectedFilter.getBindingContext("viewModel").getProperty("BUCKET_ID");

                var previouslySelectedFilters = this.getView().getModel("viewModel").getProperty("/selectedVisualFilters");
                previouslySelectedFilters = previouslySelectedFilters.filter(function (filter){
                    if (filter.group == group){
                        return false;
                    }
                    return true;
                });
                this.getView().getModel("viewModel").setProperty("/selectedVisualFilters", previouslySelectedFilters);
                this.selectEventCategory();
                if (previouslySelectedFilters.length >= 1) {
                    this.onSelectVisualFilter();
                }
            },
            /**
             * Initialises Bubble Chart
             * - Sets colors and item bindings
             */
            initBubbleChart: function () {
                var oBubbleChart = this.byId("idVisualFilterBubbleChart");
                var bubbleColors = ["rgb(39,163,221)", "rgb(248,172,31)", "rgb(220,13,14)"];
                oBubbleChart.setProperty("xAxisColors", bubbleColors);
                oBubbleChart.setProperty("yAxisColors", bubbleColors);

                var oModel = this.getView().getModel();
                oBubbleChart.setModel(oModel);

                var oTemplate = new VisualFilterPlotItem({
                    label: {path: "EVENT_NAME"},
                    xValue: {path: this.oBubbleChartFields.x, formatter: this.validateNumber},
                    yValue: {path: this.oBubbleChartFields.y, formatter: this.validateNumber}
                });

                oBubbleChart.bindAggregation("items", {
                    path: "/DisplayedEvents",
                    template: oTemplate
                });
                oBubbleChart.setVisible(true);
            },
            /**
             * Handles clicks on the Top Events List
             * @param {*} event - The click on the list
             */
            onTopEventSelection: function (event) {
                var selectedEvent = event.getParameters().listItem.getBindingContext().getModel().getProperty( event.getParameters().listItem.getBindingContext().getPath());
                var currentEvent = FilterService.getFilterValue("SelectedEvent", this.EventSelectionStorageKey);
                if (!selectedEvent || currentEvent && currentEvent.EVENT_GROUP == selectedEvent.EVENT_GROUP && currentEvent.EVENT_NAME == selectedEvent.EVENT_NAME) {
                    this.deselectEvent();
                } else {
                    this.selectEvent(selectedEvent);
                }
            },
            /**
             * Updates the bindings (length, path, sorting and items) of
             * each Top Events List.
             */
            updateTopEvents: function () {
                var oTopEvents = [
                    {id:"topRiskEventList",templateId:"topRiskEventItemTemplate", sortPath:"INFLUENCE", sortDesc: true},
                    {id:"topImpactEventList",templateId:"topImpactEventItemTemplate", sortPath:"IMPACT", sortDesc: true}
                    //,
                   // {id:"topDTREventList",templateId:"topDTREventItemTemplate", sortPath:"DAYS_TO_REACT", sortDesc: false}
                ];
                var iEventListLength = 5;
                var that = this;
                oTopEvents.forEach(function (list) {
                    var oList = that.byId(list.id);
                    oList.setBusyIndicatorDelay(0);
                    oList.setBusy(true);
                    var oEventListItemTemplate = that.byId(list.templateId);
                    oList.bindAggregation("items", {
                        length: iEventListLength,
                        path: "/DisplayedEvents",
                        sorter: new Sorter(list.sortPath, list.sortDesc),
                        template: oEventListItemTemplate
                    });
                    oList.setBusy(false);
                });
            },
            /**
             * Handles the selection of Bubble Chart bubbles
             * @param {*} event - The click event on the chart
             */
            onSelectVisualFilterBubbles: function (event) {
                var oExtents = event.getParameter("extents");
                var eventTable = this.byId("idEventListTable");

                if (!oExtents){
                    eventTable.bindAggregation("rows", {
                        sorter: new Sorter("IMPACT", true),
                        path:"/DisplayedEvents"
                    });
                    this.deselectEvent();
                    return;
                }
                var minImpact = oExtents.x[0];
                var maxImpact = oExtents.x[1];
                var minInfluence = oExtents.y[0];
                var maxInfluence = oExtents.y[1];
                var oModel = this.getView().getModel();
                var eventList = oModel.getProperty('/DisplayedEvents');
                var selectedEvents = [];
                eventList.forEach(function (event){
                    if (event.IMPACT <= maxImpact && event.IMPACT >= minImpact
                        && event.INFLUENCE <= maxInfluence && event.INFLUENCE >= minInfluence){
                        selectedEvents.push(event);
                    }
                });
                this.getView().getModel().setProperty('/SelectedEvents', selectedEvents);
                eventTable.bindAggregation("rows", {
                    sorter: new Sorter("IMPACT", true),
                    path:"/SelectedEvents"
                });
            },
            /**
             * Updates the Events Table binding
             */
            updateEventsList: function() {
                var eventTable = this.byId("idEventListTable");
                eventTable.bindAggregation("rows", {
                    sorter: new Sorter("IMPACT", true),
                    path:"/DisplayedEvents"
                });
            },
            /**
             * De-selects an event on the Top Events List
             */
            deselectEvent: function (){
                FilterService.setFilterValue("SelectedEvent", null, this.EventSelectionStorageKey);
                var oJSONModel = this.getView().getModel("viewModel");
                oJSONModel.setProperty('/SelectedEventName', null);
                this.byId('idEventListTable').setSelectedIndex(-1);

                this.selectEventInList(null, this.byId('topRiskEventList'));
                this.selectEventInList(null, this.byId('topImpactEventList'));
                //this.selectEventInList(null, this.byId('topDTREventList'));
                var customerTable = this.byId('idCustomerListTable');
                customerTable.setBusy(false);
                customerTable.setShowNoData(true);
                customerTable.bindRows({ path: 'CRI>' });
            },
            /**
             * Handles the changing of container content
             * @param {*} oEvent - The click event on the tab
             */
            onChangeChartContainerContent: function (oEvent){
                var isTopEvents = oEvent.getParameter("selectedItemId").indexOf("idTopEventsContainer") != -1;
                var eventTable = this.byId("idEventListTable");
                eventTable.setVisible(!isTopEvents);
                this.deselectEvent();
                this.updateVisualFilterBubbleChart();
            },
            /**
             * Handles the event selection on the Events Table
             * @param {*} event - The click event on the Events Table
             */
            onEventSelectionChange: function (event) {
                if (event.getParameters().userInteraction == false) {
                    return;
                } else if (this.byId('idEventListTable').getSelectedIndex() === -1) {
                    this.deselectEvent();
                    return;
                }

                var selectedEvent = event.getParameters().rowContext.getModel().getProperty(event.getParameters().rowContext.getPath());
                this.selectEvent(selectedEvent);
            },
            /**
             * Selects an event in the Top Events List
             * @param {string} eventName - Name of the event
             * @param {*} list - List object
             */
            selectEventInList: function (eventName, list) {
                list.removeSelections();
                list.getItems().forEach(function (listItem) {
                    if (listItem.getBindingContext().getProperty("EVENT_NAME") == eventName) {
                        list.setSelectedItem(listItem);
                    }
                });
            },
            /**
             * Selects an event and makes an OData call to Customers
             * @param {*} event - Event which was selected
             */
            selectEvent: function (event) {
                FilterService.setFilterValue("SelectedEvent", event, this.EventSelectionStorageKey);
                var eventName = event["EVENT_NAME"];
                var eventGroup = event["EVENT_GROUP"];
                var eventId = event["EVENT_ID"];
                var sDateRangeFilters = this.getDateRangeFilterString();
                var sFilterString = FilterService.getEncodedFilterString() || "";
                var custListPath = "/CustomerByEventParameters(IP_EVENT_ID='" +  encodeURIComponent(eventId) + "'," + sDateRangeFilters + ",IP_FILTER='" + sFilterString + "')/Results";
                //"/EventOverview(IP_FILTER='" + "'," + sDateRangeFilters + ",EVENT_NAME='" + encodeURIComponent(eventName) + "',EVENT_GROUP='" + 
                //					encodeURIComponent(eventGroup) + "',EVENT_ID='" + encodeURIComponent(eventId) + "')/Customer";
                var customerTable = this.byId('idCustomerListTable');
                var oJSONModel = this.getView().getModel("viewModel");
                oJSONModel.setProperty('/SelectedEventName', event.EVENT_NAME);
                customerTable.setBusyIndicatorDelay(0);
                customerTable.setBusy(true);
                customerTable.setShowNoData(false);

                this.selectEventInList(eventName, this.byId('topRiskEventList'));
                this.selectEventInList(eventName, this.byId('topImpactEventList'));
               // this.selectEventInList(eventName, this.byId('topDTREventList'));

                customerTable.bindRows({
                    path: 'CRI>' + custListPath
                });
                var binding = customerTable.getBinding("rows");

                binding.attachDataReceived(function () {
                    customerTable.setBusy(false);
                });
            },
            /**
             * Selects a specific category and updates the JSONModel properties
             * based on the category.
             */
            selectEventCategory: function () {
                var sGroup = this.getView().getModel("viewModel").getProperty("/selectedEventCategory");
                var eventCategories = this.byId('idEventCategorySelect');
                var items = eventCategories.getItems();
                for (var i = 0; i < items.length; i++) {
                    if (items[i].getText() === sGroup) {
                        eventCategories.setSelectedKey(items[i].getKey());
                    }
                }

                FilterService.setFilterValue("EventGroup", sGroup, this.EventSelectionStorageKey);
                FilterService.setFilterValue("BubbleChartSelection", null, this.EventSelectionStorageKey);

                var oModel = this.getView().getModel();
                var aEvents = oModel.getProperty("/Events");
                var aDisplayedEvents = [];
                if (sGroup == this.AllCategoriesKey) {
                    aDisplayedEvents = aEvents;
                } else {
                    aEvents.forEach(function (oEvent) {
                        if (oEvent.EVENT_GROUP.toLowerCase() === sGroup.toLowerCase()) {
                            aDisplayedEvents.push(oEvent);
                        }
                    });
                }
                oModel.setProperty("/DisplayedEvents", aDisplayedEvents);
                this.updateVisualFilterBubbleChart();
            },
            /**
             * Updates the Bubble Chart by deleting the selection frame. The
             * function is called whenever a front-end filter is applied.
             */
            updateVisualFilterBubbleChart: function () {
                var oBubbleChart = this.byId("idVisualFilterBubbleChart");
                oBubbleChart.setSelectionFrame(null);
                this.updateEventsList();
            },
            /**
             * Updates the Event Categories above the below the Visual Filters.
             */
            updateEventCategories: function () {
                var aEventCategories = [];
                var aEvents = this.getView().getModel().getProperty("/Events");
                var that = this;
                if (aEvents) {
                    aEvents.forEach(function (oEvent) {
                        var sEventGroup = oEvent.EVENT_GROUP;
                        if (aEventCategories.length == 0) {
                            aEventCategories.push({"EVENT_GROUP": sEventGroup});
                        } else {
                            for (var i = 0; i < aEventCategories.length; i++) {
                                if (!that.containsCategory(aEventCategories, sEventGroup)) {
                                    aEventCategories.push({"EVENT_GROUP": sEventGroup});
                                }
                            }
                        }
                    });
                }
                aEventCategories = [{"EVENT_GROUP": this.AllCategoriesKey}].concat(aEventCategories);
                var oViewModel = this.getView().getModel("viewModel");
                oViewModel.setProperty("/EventCategories", aEventCategories);
                oViewModel.setProperty("/selectedEventCategory", this.AllCategoriesKey);
                this.deselectEvent();
            },
            /**
             * Helper function which checks if a category already exists
             * within an array.
             * @param {Array} aEventCategories - Array of categories
             * @param {string} sCategory - Name of the category
             * @returns {boolean} - Result of existence
             */
            containsCategory: function (aEventCategories, sCategory) {
                for (var i = 0; i < aEventCategories.length; i++) {
                    var sExistingCategory = aEventCategories[i].EVENT_GROUP;
                    if (sExistingCategory == sCategory) {
                        break;
                    } else if (i == aEventCategories.length - 1) {
                        return false;
                    }
                }
                return true;
            },
            /**
             * Obtains the search filter value
             * @returns {string} - The value which was searched.
             */
            getSearchFilterValue: function() {
                var oFilterKeys = FilterService.getFilterConfig().filterKeys;
                var sSearchValue = FilterService.getFilterValue(oFilterKeys.eventSearchQuery);
                var oFilterBar = this.byId("idFilterBar").oFilterBar;
                var aFilterItems = oFilterBar.getFilterItems();
                var oFilterItem;
                for (var i = 0; i < aFilterItems.length; i++) {
                    if (aFilterItems[i].getName() == oFilterKeys.eventSearchQuery) {
                        oFilterItem = aFilterItems[i];
                        break;
                    }
                }
                if (oFilterItem) {
                    var oControl = oFilterBar.determineControlByFilterItem(oFilterItem);
                    sSearchValue = oControl.getProperty("value");
                }
                return sSearchValue;
            },
            /**
             * Obtains an array of OData filters
             * @returns {Array}
             */
            getODataFilters: function () {
                var ODataFilters = [];

                var sEventName = this.getSearchFilterValue();
                if (sEventName) {
                    var sFilterString = encodeURIComponent("'" + sEventName.toLowerCase() + "'");
                    var oSearchFilter = new Filter("tolower(EVENT_NAME)", FilterOperator.Contains, sFilterString);
                    ODataFilters.push(oSearchFilter);
                }

                var sGroup = FilterService.getFilterValue("EventGroup", this.EventSelectionStorageKey) || this.AllCategoriesKey;

                if (sGroup != this.AllCategoriesKey) {
                    ODataFilters.push(new Filter("EVENT_GROUP", FilterOperator.EQ, sGroup));
                }

                if (ODataFilters.length > 0) {
                    ODataFilters = [new Filter({filters:ODataFilters, and:true})];
                }

                return ODataFilters;
            },
            /**
             * Handles the changing of filters
             */
            onFilterChanged: function () {
                var oModel = this.getView().getModel();
                var sDateRangeFilters = this.getDateRangeFilterString();
                var oEventOverviewPage = this.byId("idEventOverviewPage");
                oEventOverviewPage.setBusyIndicatorDelay(0);
                oEventOverviewPage.setBusy(true);

                FilterService.setFilterValue("EventGroup", this.AllCategoriesKey, this.EventSelectionStorageKey);
                var oFilters = this.getODataFilters();
                var filterString = FilterService.getEncodedFilterString() || "";
                var eventOverviewPath = '/EventOverviewParameters(' + sDateRangeFilters + ',IP_FILTER=\'' + filterString  + '\')/Results';
                var that = this;
                this.getView().getModel("CRI").read(eventOverviewPath, {
                    filters: oFilters,
                    success: function (oData) {
                        oModel.setProperty("/Events", oData.results);
                        oModel.setProperty("/DisplayedEvents", oData.results);
                        oEventOverviewPage.setBusy(false);
                        that.updateEventCategories();
                        that.selectEventCategory();
                        that.updateVisualFilters();
                    }, error: function () {}
                });
            },
            /**
             * Handles the selection of event categories
             * @param {*} oEvent - The click event on the category
             */
            onEventCategorySelection: function (oEvent) {
                var sGroup = oEvent.getParameters().selectedItem.getText();
                this.getView().getModel("viewModel").setProperty("/selectedEventCategory", sGroup);
                this.selectEventCategory(sGroup);
                this.deselectEvent();
                this.updateVisualFilters();
            },
            /**
             * Handles the selection of a customers' details
             * @param {*} event - The click event on the details
             */
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
            /**
             * Handles the clearing of filters
             */
            onClearFilters: function () {
                FilterService.resetFilterData(this.VisualFilterStorageKey);
                this.onDeselectVisualFilter();
                this.onFilterChanged();
            },
            /**
             * Helper function which validates numbers
             * @param {*} oValue - An object which requires validating
             * @returns {number} - An object which determines the validity of the initial value
             */
            validateNumber: function (oValue) {
                return Number(oValue) || 0;
            },
            /**
             * Formats numeric content
             * @param {*} value - A value (supposedly a number)
             * @returns {*} - An object which determines the validity of the initial value
             */
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
            /**
             * Formats the bucket color
             * @param {int} iBucketIndex - The bucket index
             * @returns {string} - A string defining the color
             */
            bucketColorFormatter: function (iBucketIndex) {
                switch (iBucketIndex) {
                    case 3: return this.oBucketColor.high;
                    case 2: return this.oBucketColor.medium;
                    case 1:
                    default:
                        return this.oBucketColor.low;
                }
            },
            /**
             * Formatter for table title
             * @param {string} - sTitle - Customer Title
             * @param {string} - sSubTitle - String to be added incase event selected
             * @param {string} - sEventName - Event name to be added
             * @returns {string} - Table Title - Final output table title
             */
            formatCustomerTableTitle: function(sTitle, sSubTitle, sEventName){
            	if(!sEventName){
            		return sTitle;
            	} else{
            		return sTitle + sSubTitle + ": " + sEventName;
            	}
            },
            /**
             * Exports the event list
             */
            exportEventList: function() {
                var oModel = this.getView().getModel();
                var aEventList = oModel.getProperty("/SelectedEvents") ? oModel.getProperty("/SelectedEvents") : oModel.getProperty("/DisplayedEvents");
                var arrayOfData = [
                    ["Event Group", "Event Name", "Impact", "Risk"]
                ];
                if (aEventList) {
                    aEventList.forEach(function (entry) {
                        arrayOfData.push([
                            entry.EVENT_GROUP,
                            entry.EVENT_NAME,
                            entry.IMPACT,
                            entry.INFLUENCE
                        ]);
                    });
                    Utilities.saveCSV(arrayOfData, "Event List");
                } else {
                    // List is empty
                }
            },
            sortFilters: function(a,b){
                return a.SEQ < b.SEQ ? 1 : -1;
            },
            /**
             * Exports the customers list
             */
            exportCustomerList: function() {
                var table = this.getView().byId("idCustomerListTable");
                var selectedCustomers = table.getSelectedIndices();
                var customersToExport = [];

                selectedCustomers.forEach(function (rowIndex) {
                    var context = table.getContextByIndex(rowIndex);
                    var data = context.getModel().getProperty(context.getPath());
                    customersToExport.push({
                        CustomerId: data['CUST_ID'],
                        OriginId: data['EXT_ID'],
                        CustomerName: data['NAME'],
                        OperatingIncome: data['INCOME_LOSS_ROUND'],
                        Churned: data['CHURNED_FLAG'] ? 'Yes' : 'No',
                        Currency: data['CURRENCY']
                    });
                });

                this.getOwnerComponent().exportDialog.open(this.getView(), customersToExport);
            },
            
            filterEvents : function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                var oFilter = null;

                if (sQuery) {
                    var filterArray = [
                        new Filter("EVENT_NAME", FilterOperator.Contains, sQuery),
                        new Filter("EVENT_GROUP", FilterOperator.Contains, sQuery)
                    ];

                    oFilter = new sap.ui.model.Filter(filterArray, false);
                }

				var oTable = this.getView().byId("idEventListTable");
                oTable.setBusyIndicatorDelay(0);
                oTable.setBusy(true);
                oTable.getBinding("rows").filter(oFilter, "Control");
                oTable.setBusy(false);
	
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