sap.ui.define([
    "sap/fiori/cri/control/BaseControl",
    "sap/fiori/cri/service/FilterService",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Item",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterItem",
    "sap/m/SearchField",
    "sap/m/ComboBox",
    "sap/m/DatePicker",
    "sap/m/MessageBox"
    ],
    /**
     * Filter Bar
     * @param {sap.fiori.cri.control.BaseControl} BaseControl Base Control
     * @param {sap.fiori.cri.service.FilterService} FilterService Filter Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSON Model
     * @param {sap.ui.core.Item} Item Item
     * @param {sap.ui.comp.filterbar.FilterBar} FilterBar FilterBar
     * @param {sap.ui.comp.filterbar.FilterItem} FilterItem FilterItem
     * @param {sap.m.SearchField} SearchField SearchField
     * @param {sap.m.ComboBox} ComboBox ComboBox
     * @param {sap.m.DatePicker} DatePicker DatePicker
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} Filter Bar
     */
    function (BaseControl, FilterService, JSONModel, Item, FilterBar, FilterItem, SearchField, ComboBox, DatePicker,
    MessageBox) {
        'use strict';
        return BaseControl.extend("sap.fiori.cri.control.FilterBar", {
            metadata: {
                properties: {
                    showDateRange: {type: "boolean", defaultValue: false},
                    searchFilterKey: {type: "string", defaultValue: null}
                },
                events: {
                    filtersLoaded: {
                        parameters : {}
                    },
                    filterChange : {
                        parameters : {
                            key : {type : "string"},
                            value : {type : "object"},
                            control : {type : "object"}
                        }
                    },
                    clearFilters : {
                        parameters : {
                            selectionSet : {type : "object"}
                        }
                    }
                }
            },
            init: function () {
                //Setup filter model
                var filterModel = new JSONModel({ FilterItems:[] });
                this.setModel(filterModel, "filterModel");
            },
            onAfterRendering: function () {
                if (this.getModel("filterModel").getProperty("/FiltersLoaded")) {
                    return;
                }

                this.loadLabels("FilterBar", "en-US", function () {
                    this.setupFilters();
                }.bind(this));
            },
            createContent: function () {
                var oFilterBar = new FilterBar({
                    showClearOnFB:true,
                    showGoOnFB:false,
                    showFilterConfiguration:false,
                    useToolbar:false
                });

                oFilterBar.setModel(this.getModel("filterModel"));

                oFilterBar.bindAggregation("filterItems", {
                    path:'/FilterItems',
                    factory:this.filterItemFactory.bind(this)
                });

                oFilterBar.attachClear(function (oEvent) {
                    var filters = FilterService.getDefaultFilters();
                    FilterService.setFilterData(filters);

                    var filterKeys = FilterService.getFilterConfig().filterKeys;

                    var items = this.oFilterBar.getFilterItems();
                    var controls = oEvent.getParameters().selectionSet;
                    items.forEach(function (item, i) {
                        var sKey = item.getName();
                        var control = controls[i];

                        switch (sKey) {
                            case filterKeys.fromDate:
                            case filterKeys.toDate:
                                control.setValue(filters[sKey]);
                                break;
                            case filterKeys.eventSearchQuery:
                            case filterKeys.customerSearchQuery:
                                control.setValue("");
                                break;
                            default:
                                control.clearSelection();
                                control.setValue("");
                                break;
                        }
                    });

                    this.fireEvent("clearFilters", {
                        selectionSet:oEvent.selectionSet
                    });
                }.bind(this));

                this.oFilterBar = oFilterBar;

                return oFilterBar;
            },
            setupFilters: function () {
                var filters = FilterService.getFilterData();

                var filterConfig = FilterService.getFilterConfig();
                var filterKeys = filterConfig.filterKeys;

                var oLabelModel = this.getModel("Labels");

                var sFromDateLabel = FilterService.labelForKey(filterKeys.fromDate, oLabelModel) || "From";
                var sToDateLabel = FilterService.labelForKey(filterKeys.toDate, oLabelModel) || "To";

                var sFromDateKey = filterConfig.filterKeys.fromDate;
                var sToDateKey = filterConfig.filterKeys.toDate;

                this.getModel("CRI").read("/FilterBar", {
                    success: function (oData) {
                        var oFilterItems = {};
                        var filterItems = [];

                        if (this.getSearchFilterKey()) {
                            var sSearchKey = this.getSearchFilterKey();
                            var sSearchLabel = "Search";
                            oFilterItems[sSearchKey] = {
                                name: sSearchKey,
                                label: sSearchLabel,
                                type: FilterService.FILTER_TYPE.search,
                                value: filters[sSearchKey]
                            };
                            filterItems.push(oFilterItems[sSearchKey]);
                        }

                        if (this.getShowDateRange()) {

                            // Add from date field
                            oFilterItems[sFromDateKey] = {
                                name:sFromDateKey,
                                label:sFromDateLabel,
                                type:FilterService.FILTER_TYPE.date,
                                value:filters[sFromDateKey]
                            };
                            filterItems.push(oFilterItems[sFromDateKey]);

                            // Add to date field
                            oFilterItems[sToDateKey] = {
                                name: sToDateKey,
                                label: sToDateLabel,
                                type: FilterService.FILTER_TYPE.date,
                                value: filters[sToDateKey]
                            };
                            filterItems.push(oFilterItems[sToDateKey]);
                        }

                        oData.results.forEach(function (oItem) {
                            var sKey = oItem.FIELD_NAME;

                            if (sKey == sFromDateKey || sKey == sToDateKey || sKey == "") {
                                return;
                            }

                            oFilterItems[sKey] = {
                                groupTitle: oItem.FIELD_GROUP,
                                groupName: oItem.FIELD_GROUP,
                                name: sKey,
                                label: FilterService.labelForKey(sKey, oLabelModel) || oItem.DESCRIPTION,
                                type: FilterService.FILTER_TYPE.dropDown,
                                value: filters[sKey]
                            };
                            filterItems.push(oFilterItems[sKey]);
                        });

                        this.getModel("filterModel").setProperty("/FilterItems", filterItems);
                        this.oFilterBar.rerender();

                        this.getModel("filterModel").setProperty("/FiltersLoaded", true);

                        this.fireEvent("filtersLoaded", {});
                    }.bind(this),
                    error: function (oError) {

                    }
                });
            },
            filterItemFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);

                var sFilterKey = mSettings.name;

                var oFilterItem = new FilterItem(sId, {
                    label:mSettings.label,
                    name:mSettings.name,
                    visibleInFilterBar:mSettings.visibleInFilterBar
                });

                var oControl;
                var sType = mSettings.type;
                var sValue = mSettings.value;

                switch (sType) {
                    case FilterService.FILTER_TYPE.search:
                        oControl = new SearchField();
                        oControl.setValue(sValue);

                        oControl.attachSearch(function(oEvent) {
                            var sSearchTerm = oEvent.getParameter("query");
                            this.onFilterChanged(sFilterKey, sSearchTerm, oControl);
                        }.bind(this));
                        break;
                    case FilterService.FILTER_TYPE.date:

                        oControl = FilterService.buildDateControl(sValue);

                        oControl.attachChange(function (oEvent) {
                            var sFilterValue = oEvent.getParameter("value");

                            if (FilterService.isValidDateString(sFilterValue)) {
                                this.onFilterChanged(sFilterKey, sFilterValue, oControl);
                            } else {
                                oControl.setValue(FilterService.getFilterValue(sFilterKey));
                            }
                        }.bind(this));

                        break;
                    case FilterService.FILTER_TYPE.dropDown:

                        oControl = new ComboBox();
                        var oModel = new JSONModel({ ValueHelpData:[] });
                        oControl.setModel(oModel);
						sFilterKey = encodeURI(sFilterKey);
                        this.getModel("CRI").read("/VL_VALUE_HELPParameters(IP_FIELD_NAME='" + sFilterKey + "')/Results",{
                            success:function (oResponse) {
                                var oData = oResponse.results;
                                oControl.getModel().setSizeLimit(oData.length);
                                oControl.getModel().setProperty("/ValueHelpData", oData);
                                oControl.setValue(sValue).setSelectedKey(sValue).synchronizeSelection();
                            }
                        });

                        oControl.bindAggregation("items", {
                            path: "/ValueHelpData",
                            factory: this.dropDownItemFactory,
                            sorter: { path: 'FIELD_VALUE' }
                        });

                        oControl.attachSelectionChange(function (oEvent) {
                            var item = oEvent.getParameter("selectedItem");
                            var sFilterValue = item && item.getProperty("key");
                            this.onFilterChanged(sFilterKey, sFilterValue, oControl);
                        }.bind(this));

                        break;
                    default:
                        break;
                }

                oFilterItem.setAggregation("control", oControl);

                return oFilterItem;
            },
            buildDateControl: function (oInitialValue, sValueFormat, sDisplayFormat) {
                var format = this.getFilterConfig().format;
                return new DatePicker({
                    value: oInitialValue,
                    valueFormat: sValueFormat || format.dateValue,
                    displayFormat: sDisplayFormat || format.dateDisplay
                });
            },
            dropDownItemFactory: function (sId, oContext) {
                var mSettings = oContext.oModel.getProperty(oContext.sPath);

                var sName = mSettings.FIELD_VALUE;
                sName = sName.replace(/(GRP)\d\d( )/g,"");

                var item = new Item(sId, {
                    text:sName,
                    key:mSettings.FIELD_VALUE
                });
                return item;
            },
            onFilterChanged: function (sKey, sValue, oControl) {
                var config = FilterService.getFilterConfig();
                var filterKeys = config.filterKeys;

                switch (sKey) {
                    case filterKeys.fromDate:
                        // Check other date to make sure the range is valid
                        if (!FilterService.isValidDateRange(sValue, FilterService.getFilterValue(filterKeys.toDate))) {

                            this.showInvalidDateMessage();

                            // Reset to saved value if invalid
                            oControl.setValue(FilterService.getFilterValue(sKey));
                            return;
                        }
                        break;
                    case filterKeys.toDate:
                        // Check other date to make sure the range is valid
                        if (!FilterService.isValidDateRange(FilterService.getFilterValue(filterKeys.fromDate), sValue)) {

                            this.showInvalidDateMessage();

                            // Reset to saved value if invalid
                            oControl.setValue(FilterService.getFilterValue(sKey));
                            return;
                        }
                        break;
                    default:
                        break;
                }

                FilterService.setFilterValue(sKey, sValue);

                this.fireEvent("filterChange", {
                    key:sKey,
                    value:sValue,
                    control:oControl
                });
            },
            showInvalidDateMessage: function () {
                MessageBox.error("Please select a valid date range.", {
                    title: "Invalid date range"
                });
            },
            getSelectedFilterLabels: function () {
                var oLabelModel = this.getModel("Labels");
                return FilterService.getSelectedFilterLabels(oLabelModel);
            },
            getFilteredByString: function () {
                var oLabelModel = this.getModel("Labels");
                var filterLabels = FilterService.getSelectedFilterLabels(oLabelModel);
                var filterServiceLabels = FilterService.getFilterConfig().filterLabels;
                var bShowDateRange = this.getShowDateRange();
                if (filterLabels) {
                    filterLabels = filterLabels.filter(function (sLabel) {
                        if (!bShowDateRange && (sLabel == filterServiceLabels.fromDate || sLabel == filterServiceLabels.toDate)) { return false; }
                        return true;
                    });
                    var sFilteredByLabel = oLabelModel.getProperty("/FilteredByLabel") || "Filtered By";
                    return sFilteredByLabel + ": " + filterLabels.join(", ");
                }
                return "";
            },
            getFilterData: function() {
                return FilterService.getFilterConfig();
            },
            getFilterControl: function(sKey) {

                var oFilterItem = this.getFilterItem(sKey);

                if (oFilterItem) {
                    return this.oFilterBar.determineControlByFilterItem(oFilterItem);
                }

                return null;
            },
            getFilterItem: function(sKey) {

                var oFilterBar = this.oFilterBar;
                var aFilterItems = oFilterBar.getFilterItems();
                var oFilterItem;

                for (var i = 0; i < aFilterItems.length; i++) {
                    if (aFilterItems[i].getName() == sKey) {
                        oFilterItem = aFilterItems[i];
                        break;
                    }
                }

                return oFilterItem;
            },
            renderer: {
                render: BaseControl.prototype.render
            }
        });
    }
);