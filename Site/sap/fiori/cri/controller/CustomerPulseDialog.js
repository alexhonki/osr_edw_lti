sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat",
    "sap/fiori/cri/model/formatter",
    "sap/fiori/cri/model/PulseChartItem",
    "sap/fiori/cri/service/Utilities",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * Customer Pulse Dialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.core.format.DateFormat} DateFormat DateFormat
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @param {sap.fiori.cri.model.PulseChartItem} PulseChartItem Pulse Chart Item
     * @param {sap.fiori.cri.service.Utilities} Utilities Utilities
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Sorter} Sorter Sorter
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @returns {*} Customer Pulse Dialog Control
     */
    function (Controller, DateFormat, Formatter, PulseChartItem, Utilities, JSONModel, Sorter, Filter, FilterOperator) {
    "use strict";
    //noinspection JSUnusedGlobalSymbols,JSValidateJSDoc
    return Controller.extend("sap.fiori.cri.controller.CustomerPulseDialog", {
        formatter: Formatter,
        _initChart: function () {

            var oChart = sap.ui.getCore().byId("idPulseChart");

            var oContainer = sap.ui.getCore().byId("chartContainer");
            sap.ui.core.ResizeHandler.register(oContainer, function(){
                oChart.refresh();
            });

            var eventTable = sap.ui.getCore().byId('idCustomerEventsTable');
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
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.CustomerPulseDialog", this);
                var model = new JSONModel();
                this._oDialog.setModel(model);
                this._initChart();
            }
            return this._oDialog;
        },
        open : function (oView, customerId, customerName, thresholds) {
            var oDialog = this._getDialog();
            oView.addDependent(oDialog);
            var model = this._oDialog.getModel();
            if (model) {
                model.setProperty("/dayEventList", []);
            }
            oDialog.open();
            if (customerId) {
                this.loadDataForId(customerId, customerName);
                this.loadThresholds(thresholds);
            }
        },
        onCloseDialog : function () {
            this._oDialog.getModel().setProperty("/CustomerId", null);
            this._oDialog.getModel().setProperty("/CustomerEvents", null);
            this._getDialog().close();
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

            this._oDialog.getModel().setProperty("/Thresholds", oThresholds);

            if (givenValidThresholds) { return; }

            this._oDialog.getModel("CRI").read("/Config", {
                success: function (oData) {

                    var oThresholdsById = {};

                    oData.results.forEach(function (oItem) {
                        var id = oItem["BUCKET_ID"];
                        var seq = oItem["SEQ"];
                        var items = oThresholdsById[id] || {};
                        items[seq] = oItem;
                        oThresholdsById[id] = items;
                    });

                    var actionRequired = oThresholdsById["ACTION_REQUIRED_THRESHOLD"];
                    oThresholds.ACTION_REQUIRED = parseFloat(actionRequired["1"].FROM_VALUE);

                    var risk = oThresholdsById["INFLUENCE"];
                    oThresholds.MEDIUM_RISK = parseFloat(risk["1"].TO_VALUE);
                    oThresholds.HIGH_RISK = parseFloat(risk["2"].TO_VALUE);

                    this._oDialog.getModel().setProperty("/Thresholds", oThresholds);

                    this._oDialog.getModel().refresh(true);
                }.bind(this),
                error: function () {
                    this.byId('idVisualFilters').setBusy(false);
                }.bind(this)
            });
        },
        loadDataForId: function (customerId, customerName) {
            this._oDialog.getModel().setProperty("/CustomerName", customerName);

            var oContainer = sap.ui.getCore().byId("chartContainer");
            oContainer.setBusyIndicatorDelay(0);
            oContainer.setBusy(true);

            var attributesContainer = sap.ui.getCore().byId("attributesContainer");
            attributesContainer.setBusyIndicatorDelay(0);
            attributesContainer.setBusy(true);

            var oDataModel = this._oDialog.getModel('CRI');

            this._oDialog.getModel().setProperty("/CustomerEvents", []);
            this._oDialog.getModel().setProperty("/CustomerAttributes", []);

            oDataModel.getMetaModel().loaded().then(function () {
                var metaModel = oDataModel.getMetaModel();
                this._oDialog.setModel(metaModel, "meta");
            }.bind(this));

            this._oDialog.getModel().setProperty("/CustomerId", customerId);

            this._getDialog().getModel('CRI').read("/Customer(" + customerId + ")/Pulse", {
                sorters: [
                    new Sorter("INIT_DATE", true)
                ],
                success: function (oData) {
                    var pulse = oData.results;

                    var mappedData = [];
                    var categories = ["ALL"];
                    for (var i = 0; i < pulse.length; i++) {
                        var d = pulse[i];

                        var transformed = {
                            Date: d["INIT_DATE"],
                            EventGroup: d["EVENT_GROUP"],
                            EventName: d["EVENT_NAME"],
                            EventDetail: d["EVENT_GROUP"] + ": " + d["EVENT_NAME"],
                            Influence: d["INFLUENCE"] / 100,
                            Data: d
                        };

                        if (categories.indexOf(d['EVENT_GROUP']) == -1) {
                            categories.push(d['EVENT_GROUP']);
                        }

                        mappedData.push(transformed);
                    }

                    this._oDialog.getModel().setProperty("/CustomerEvents", mappedData);
                    this._oDialog.getModel().setProperty("/CustomerEventCategories", categories);
                    oContainer.setBusy(false);
                }.bind(this),
                error: function () {
                    oContainer.setBusy(false);
                }
            });

            this._getDialog().getModel('CRI').read("/Customer(" + customerId + ")/Details", {
                success: function (oData) {
                    var mappedData = [];

                    var metaModel = this._oDialog.getModel("meta");
                    var oPropertyNames = {};
                    var oUnits = {};

                    if (metaModel) {
                        var aProperties = metaModel.getProperty('/dataServices/schema/[${namespace}===\'sap.cri\']/entityType/[${name}===\'CustomerDetailsType\']/property');

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

                        var number = Number(value);
                        if (number) {
                            value = Formatter.number(value, 0);
                        }

                        var sUnit = oUnits[key];

                        if (sUnit) {
                            value = value + " " + sUnit;
                        }

                        var transformed = {
                            label: label,
                            text: value
                        };

                        mappedData.push(transformed);
                    }

                    this._oDialog.getModel().setProperty("/CustomerAttributes", mappedData);
                    attributesContainer.setBusy(false);

                }.bind(this),
                error: function () {
                    attributesContainer.setBusy(false);
                }
            });
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
                    that.getView().byId("chartContainer").setBusy(false);

                });
                oChartModel.attachRequestFailed(function () {
                    that.getView().byId("chartContainer").setBusy(false);

                });

                this.oChartModel = oChartModel;
            }

            return this.oChartModel;
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
            this._oDialog.getModel().setProperty("/dayEventList", listItems);

            var dateFormat = DateFormat.getDateTimeInstance({pattern:'dd MMM yyyy'});
            var date = listItems[0].Date;
            this._oDialog.getModel().setProperty("/daySelected", dateFormat.format(date));
        },
        onEventCategorySelection: function (oEvent) {
            var customerId = this._oDialog.getModel().getProperty("/CustomerId");

            this._oDialog.getModel().setProperty("/dayEventList", []);

            var oContainer = sap.ui.getCore().byId("chartContainer");
            oContainer.setBusyIndicatorDelay(0);
            oContainer.setBusy(true);

            var categoryFilters = [];
            var category = oEvent.getParameter("selectedItem").getProperty("key");
            if (category != "ALL") {
                categoryFilters.push(new Filter("EVENT_GROUP", FilterOperator.EQ, category));
            }

            this._getDialog().getModel('CRI').read("/Customer(" + customerId + ")/Pulse", {
                filters: categoryFilters,
                sorters: [
                    new Sorter("INIT_DATE", true)
                ],
                success: function (oData) {
                    var pulse = oData.results;

                    var mappedData = [];
                    var categories = ["ALL"];
                    for (var i = 0; i < pulse.length; i++) {
                        var d = pulse[i];

                        var transformed = {
                            Date: d["INIT_DATE"],
                            EventGroup: d["EVENT_GROUP"],
                            EventName: d["EVENT_NAME"],
                            EventDetail: d["EVENT_GROUP"] + ": " + d["EVENT_NAME"],
                            Influence: d["INFLUENCE"] / 100,
                            Data: d
                        };

                        if (categories.indexOf(d['EVENT_GROUP']) == -1) {
                            categories.push(d['EVENT_GROUP']);
                        }

                        mappedData.push(transformed);
                    }

                    this._oDialog.getModel().setProperty("/CustomerEvents", mappedData);
                    oContainer.setBusy(false);
                }.bind(this),
                error: function () {
                    oContainer.setBusy(false);
                }
            });
        },
        exportEventList: function (event) {
            var customerId = this._oDialog.getModel().getProperty("/CustomerId");

            this._getDialog().getModel('CRI').read("/Customer(" + customerId + ")/Pulse", {
                sorters: [
                    new Sorter("INIT_DATE", true)
                ],
                success: function (oData) {
                        var arrayOfData = [
                            ["Event Name", "Event Group", "Risk", "Date"]
                        ];
                        var dateFormat = DateFormat.getDateTimeInstance({pattern:'dd MMM yyyy'});

                        oData.results.forEach(function (entry) {
                            arrayOfData.push([
                                entry.EVENT_NAME,
                                entry.EVENT_GROUP,
                                entry.INFLUENCE,
                                dateFormat.format(entry.INIT_DATE)
                            ]);
                        });
                        Utilities.saveCSV(arrayOfData, "Customer Event List");
                    }
                }
            );
        }
    });
});