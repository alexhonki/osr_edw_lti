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
		"sap/m/MessageBox",
		"sap/m/MultiComboBox",
		"sap/m/MultiInput",
		"sap/fiori/cri/service/ErrorService",
		"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
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
	 * @param {sap.m.MultiComboBox} MultiComboBox MultiComboBox
	 * @param {sap.m.MultiInput} MultiInput MultiInput
	 * @param {sap.ui.comp.valuehelpdialog.ValueHelpDialog} ValueHelpDialog ValueHelpDialog
	 * @returns {*} Filter Bar
	 */
	function(BaseControl, FilterService, JSONModel, Item, FilterBar, FilterItem, SearchField, ComboBox, DatePicker,
		MessageBox, MultiComboBox, MultiInput, ErrorService, ValueHelpDialog, Filter, FilterOperator) {
		'use strict';
		return BaseControl.extend("sap.fiori.cri.control.FilterBar", {
			metadata: {
				properties: {
					showDateRange: {
						type: "boolean",
						defaultValue: false
					},
					searchFilterKey: {
						type: "string",
						defaultValue: null
					}
				},
				events: {
					filtersLoaded: {
						parameters: {}
					},
					filterChange: {
						parameters: {
							key: {
								type: "string"
							},
							value: {
								type: "object"
							},
							control: {
								type: "object"
							}
						}
					},
					clearFilters: {
						parameters: {
							selectionSet: {
								type: "object"
							}
						}
					}
				}
			},
			init: function() {
				//Setup filter model
				var filterModel = new JSONModel({
					FilterItems: []
				});
				this.setModel(filterModel, "filterModel");
			},
			onAfterRendering: function() {
				//setup default to date based on admin prediction settings
				var sToDate;
				var that = this;
				this.getModel("CRI").read("/ConfigPredictionDate", {
					success: function(oData) {
						try {
							oData.results.forEach(function(dateSetting) {
								if (dateSetting.IS_ENABLED === 1) {

									sToDate = dateSetting.TO_TIME_SEGMENT.toString();
									FilterService.setDefaultToDate(sToDate);
									if (that.getModel("filterModel").getProperty("/FiltersLoaded")) {
										return;
									}

									that.loadLabels("FilterBar", "en-US", function() {
										that.setupFilters();
									});
								}
							});
						} catch (oError) {
							ErrorService.raiseGenericError(oError);
						}
					},
					error: function(oError) {
						ErrorService.raiseGenericError(oError);
					}
				});

			},
			createContent: function() {
				var oFilterBar = new FilterBar({
					showClearOnFB: true,
					showGoOnFB: false,
					showFilterConfiguration: false,
					useToolbar: false
				});

				oFilterBar.setModel(this.getModel("filterModel"));

				oFilterBar.bindAggregation("filterItems", {
					path: '/FilterItems',
					factory: this.filterItemFactory.bind(this)
				});

				oFilterBar.attachClear(function(oEvent) {
					var filters = FilterService.getDefaultFilters();
					FilterService.setFilterData(filters);

					var filterKeys = FilterService.getFilterConfig().filterKeys;

					var items = this.oFilterBar.getFilterItems();
					var controls = oEvent.getParameters().selectionSet;
					items.forEach(function(item, i) {
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
								
								control.setValue("");
								if (control.getMetadata().hasAggregation("tokens")) {
									control.removeAllTokens();
									control.rerender();
									
								} else{
									control.clearSelection();
								}
								break;
						}
					});

					this.fireEvent("clearFilters", {
						selectionSet: oEvent.selectionSet
					});
				}.bind(this));

				this.oFilterBar = oFilterBar;

				return oFilterBar;
			},
			setupFilters: function() {
				var filters = FilterService.getFilterData();

				var filterConfig = FilterService.getFilterConfig();
				var filterKeys = filterConfig.filterKeys;

				var oLabelModel = this.getModel("Labels");

				var sFromDateLabel = FilterService.labelForKey(filterKeys.fromDate, oLabelModel) || "From";
				var sToDateLabel = FilterService.labelForKey(filterKeys.toDate, oLabelModel) || "To";

				var sFromDateKey = filterConfig.filterKeys.fromDate;
				var sToDateKey = filterConfig.filterKeys.toDate;

				this.getModel("CRI").read("/FilterBar", {
					success: function(oData) {
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
								name: sFromDateKey,
								label: sFromDateLabel,
								type: FilterService.FILTER_TYPE.date,
								value: filters[sFromDateKey]
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

						oData.results.forEach(function(oItem) {
							var sKey = oItem.FIELD_NAME;

							if (sKey === sFromDateKey || sKey === sToDateKey || sKey === "") {
								return;
							}

							oFilterItems[sKey] = {
								groupTitle: oItem.FIELD_GROUP,
								groupName: oItem.FIELD_GROUP,
								name: sKey,
								label: FilterService.labelForKey(sKey, oLabelModel) || oItem.DESCRIPTION,
								type: sKey === "PPR_POSTCODE" ? FilterService.FILTER_TYPE.multiComboBox : FilterService.FILTER_TYPE.dropDown,
								value: filters[sKey]
							};
							filterItems.push(oFilterItems[sKey]);
						});

						this.getModel("filterModel").setProperty("/FilterItems", filterItems);
						this.oFilterBar.rerender();

						this.getModel("filterModel").setProperty("/FiltersLoaded", true);

						this.fireEvent("filtersLoaded", {});
					}.bind(this),
					error: function(oError) {

					}
				});
			},
			filterItemFactory: function(sId, oContext) {
				var mSettings = oContext.oModel.getProperty(oContext.sPath);

				var sFilterKey = mSettings.name;

				var oFilterItem = new FilterItem(sId, {
					label: mSettings.label,
					name: mSettings.name,
					visibleInFilterBar: mSettings.visibleInFilterBar
				});

				var oControl;
				var sType = mSettings.type;
				var sValue = mSettings.value;
				var oModel = new JSONModel({
					ValueHelpData: []
				});

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

						oControl.attachChange(function(oEvent) {
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
						oControl.setModel(oModel);
						sFilterKey = encodeURI(sFilterKey);
						this.getModel("CRI").read("/VL_VALUE_HELPParameters(IP_FIELD_NAME='" + sFilterKey + "')/Results", {
							success: function(oResponse) {
								var oData = oResponse.results;
								oControl.getModel().setSizeLimit(oData.length);
								oControl.getModel().setProperty("/ValueHelpData", oData);
								oControl.setValue(sValue).setSelectedKey(sValue).synchronizeSelection();
							}
						});

						oControl.bindAggregation("items", {
							path: "/ValueHelpData",
							factory: this.dropDownItemFactory,
							sorter: {
								path: 'FIELD_VALUE'
							}
						});

						oControl.attachSelectionChange(function(oEvent) {
							var item = oEvent.getParameter("selectedItem");
							var sFilterValue = item && item.getProperty("key");
							this.onFilterChanged(sFilterKey, sFilterValue, oControl);
						}.bind(this));

						break;
					case FilterService.FILTER_TYPE.multiComboBox:
						var bIgnoreTokenChange = false;
						var aTokens = [];
						var that = this;
						oControl = new MultiInput({
							enableMultiLineMode: false,
							showSuggestion: true,
							maxSuggestionWidth: "auto",
							tokenUpdate: function(oControlEvent) {
								if (bIgnoreTokenChange) {
									return;
								}
								if (oControlEvent.getParameter("type") === sap.m.Tokenizer.TokenChangeType.Removed) {
									var aRemovedTokens = oControlEvent.getParameter("removedTokens");
									for (var j = 0; j < aRemovedTokens.length; j++) {
										var sKey = aRemovedTokens[j].getKey();

										for (var i in aTokens) {
											if (aTokens[i].getKey() === sKey) {
												aTokens.splice(i, 1);
												break;
											}
										}
									}
								}

								if (oControlEvent.getParameter("type") === sap.m.Tokenizer.TokenChangeType.Added) {
									var aAddedTokens = oControlEvent.getParameter("addedTokens");
									for (j = 0; j < aAddedTokens.length; j++) {
										aTokens.push(aAddedTokens[j]);
									}
								}

								//trigger filter event
								that.triggerFilterChangedWithTokens(sFilterKey, aTokens, oControlEvent.getSource());

							}
						});

						oControl.setModel(oModel);
						sFilterKey = encodeURI(sFilterKey);
						this.getModel("CRI").read("/VL_VALUE_HELPParameters(IP_FIELD_NAME='" + sFilterKey + "')/Results", {
							success: function(oResponse) {
								var oData = oResponse.results;
								oControl.getModel().setSizeLimit(oData.length);
								oControl.getModel().setProperty("/ValueHelpData", oData);

							}
						});

						//         oControl.bindAggregation("items", {
						//             path: "/ValueHelpData",
						//             template: new Item({
						//          text:"{FIELD_VALUE}",
						//          key:"{FIELD_VALUE}"
						// }),
						//             sorter: { path: "FIELD_VALUE" }
						//         });

						//               oControl.attachSelectionFinish(function (oEvent){
						//               	oEvent.getSource().rerender();// render the tokens
						//               	var aSelectedItems = oEvent.getParameter("selectedItems");
						//               	var sSelectedKeys = "";
						//               	if(aSelectedItems.length > 0){
						//               		aSelectedItems.map(function(item){
						// sSelectedKeys = sSelectedKeys.length > 0 ? sSelectedKeys + "," + sFilterKey + ":" + item.getProperty("key") 
						// 											: item.getProperty("key");
						//               		});
						//               	}
						//               	this.onFilterChanged(sFilterKey,sSelectedKeys,oControl);

						//               }.bind(this));
						var oValueHelpDialog = null;

						
						oControl.attachValueHelpRequest(function() {
							if (oValueHelpDialog) {
								//sometimes we get two ValueHelpRequests events, so we ignore the second when we have a
								return;
							}
							var sDesc = oControl.getModel().getProperty("/ValueHelpData")[0].FIELD_DESCRIPTION;
							oValueHelpDialog = new ValueHelpDialog("idPprValueHelpDialog", {
								basicSearchText: oControl.getValue(),
								title: sDesc,
								supportMultiselect: true,
								supportRanges: false,
								supportRangesOnly: false,
								filterMode: false,
								key: "FIELD_VALUE",
								descriptionKey: "FIELD_VALUE",

								ok: function(oControlEvent) {
									aTokens = oControlEvent.getParameter("tokens");
									bIgnoreTokenChange = true;
									oControl.setTokens(aTokens);
									bIgnoreTokenChange = false;
									oControl.rerender();

									oValueHelpDialog.close();
									oValueHelpDialog = null;
									
									that.triggerFilterChangedWithTokens(sFilterKey, aTokens, oControl);
									
								},

								cancel: function(oControlEvent) {
									
									oValueHelpDialog.close();
									oValueHelpDialog = null;
								},

								afterClose: function() {
									this.destroy();
									oValueHelpDialog = null;
								}
							});
							var oTable = null;

							var oValueTable = new sap.ui.table.Table({
								selectionMode: sap.ui.table.SelectionMode.Multi

							});
							oValueTable.addColumn(new sap.ui.table.Column({
								label: new sap.m.Label({
									text: sDesc
								}),
								template: new sap.m.Label({
									text: "{FIELD_VALUE}"
								})
							}));

							oValueTable.setModel(oModel);
							oValueTable.bindRows("/ValueHelpData");
							oValueHelpDialog.setTable(oValueTable);
							if(oControl.getTokens().length < 1){
								aTokens = [];
							}
							oValueHelpDialog.setTokens(aTokens);
							var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
								advancedMode: true,
								search: function(oEvent) {
									
									var aFilter, sMsg;
									if (this.getBasicSearch()) {
										sMsg = sap.ui.getCore().byId(this.getBasicSearch()).getValue();
										//filter the postcode table
										aFilter = [new Filter("FIELD_VALUE", FilterOperator.Contains, sMsg)];
									}
									var oFilter = new sap.ui.model.Filter(aFilter, false);
									var oDialog = sap.ui.getCore().byId("idPprValueHelpDialog");
									oDialog.getTable().getBinding("rows").filter(oFilter, "Application");
								}

							});

							oFilterBar.setBasicSearch(new sap.m.SearchField({
								showSearchButton: false,
								placeholder: "Search",
								search: function(oEvent) {
									var sText = oEvent.getParameter("query");
									//filter the postcode table
									var aFilter = [new Filter("FIELD_VALUE", FilterOperator.Contains, sText)];
									var oFilter = new sap.ui.model.Filter(aFilter, false);
									var oDialog = sap.ui.getCore().byId("idPprValueHelpDialog");
									var oBinding = oDialog.getTable().getBinding("rows");
									oBinding.attachChange(function() {
										oDialog.update();
									});
									oBinding.filter(oFilter, "Application");

								}

							}));

							oValueHelpDialog.setFilterBar(oFilterBar);

							oValueHelpDialog.open();
							oValueHelpDialog.update();

						});
						if(sValue){
							var aPostcodeTokens = [];
							//filter value set from other view, then create tokens
							var aTokenList = sValue.split(",");
							aPostcodeTokens.push(aTokenList[0]);
							if(aTokenList.length > 1){
								for(var i = 1; i < aTokenList.length; i++){
									aPostcodeTokens.push(aTokenList[i].split(":")[1]);
								}
							}
							aPostcodeTokens.forEach(function(item){
								aTokens.push(new sap.m.Token({key: item, text: item +" (" + item + ")"}));
							});
							oControl.setTokens(aTokens);
							oControl.rerender();
						}
						break;
					default:
						break;
				}

				oFilterItem.setAggregation("control", oControl);

				return oFilterItem;
			},
			buildDateControl: function(oInitialValue, sValueFormat, sDisplayFormat) {
				var format = this.getFilterConfig().format;
				return new DatePicker({
					value: oInitialValue,
					valueFormat: sValueFormat || format.dateValue,
					displayFormat: sDisplayFormat || format.dateDisplay
				});
			},
			dropDownItemFactory: function(sId, oContext) {
				var mSettings = oContext.oModel.getProperty(oContext.sPath);

				var sName = mSettings.FIELD_VALUE;
				sName = sName.replace(/(GRP)\d\d( )/g, "");

				var item = new Item(sId, {
					text: sName,
					key: mSettings.FIELD_VALUE
				});
				return item;
			},
			onFilterChanged: function(sKey, sValue, oControl) {
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
					key: sKey,
					value: sValue,
					control: oControl
				});
			},
			showInvalidDateMessage: function() {
				MessageBox.error("Please select a valid date range.", {
					title: "Invalid date range"
				});
			},
			getSelectedFilterLabels: function() {
				var oLabelModel = this.getModel("Labels");
				return FilterService.getSelectedFilterLabels(oLabelModel);
			},
			getFilteredByString: function() {
				var oLabelModel = this.getModel("Labels");
				var filterLabels = FilterService.getSelectedFilterLabels(oLabelModel);
				var filterServiceLabels = FilterService.getFilterConfig().filterLabels;
				var bShowDateRange = this.getShowDateRange();
				if (filterLabels) {
					filterLabels = filterLabels.filter(function(sLabel) {
						if (!bShowDateRange && (sLabel == filterServiceLabels.fromDate || sLabel == filterServiceLabels.toDate)) {
							return false;
						}
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
			},
			triggerFilterChangedWithTokens: function(sFilterKey,aTokens,oControl) {
				var sTokens = "";
				for (var i = 0; i < aTokens.length; i++) {
					var oToken = aTokens[i];
					sTokens = sTokens.length > 0 ? sTokens + "," + sFilterKey + ":" + oToken.getKey() : oToken.getKey();

				}
				this.onFilterChanged(sFilterKey, sTokens, oControl);

			}
		});
	}
);