//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/controller/PredefinedEventsEditorDialog",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.controller.PredefinedEventsEditorDialog} PredefinedEventEditor Dialog
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, PredefinedEventEditor, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.PredefinedEventsSettings", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({});
                this.getView().setModel(oJSONModel);

                this.predefinedEventEditor = new PredefinedEventEditor();

            },
            onBeforeRendering: function () {
                this.loadLabels("PredefinedEventsSettings", "en-US");
            },
            createPredefinedEvent: function (oEvent) {
                this.predefinedEventEditor.open(this.getView());
            },
            onRowSelectionChange: function () {
                var table = this.getView().byId("predefinedEventList");
                var numSelectedRows = table.getSelectedIndices().length;
                this.getView().getModel().setProperty("/SelectedRowCount", numSelectedRows);
            },
            doActivate: function () {
                this.setStatus('Activate');
            },
            doDeactivate: function () {
                this.setStatus('Deactivate');
            },
            setStatus: function (sActionName) {
                var aEventList = [];
                var table = this.getView().byId("predefinedEventList");
                var eventList = table.getSelectedIndices();
                eventList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel().getProperty(context.getPath());
                    aEventList.push({
                        EventName: model["EVENT_NAME"],
                        Path: context.getPath()
                    });
                });

                var criModel = this.getView().getModel("CRI");

                var errorIds = [];

                aEventList.forEach(function (oEvent) {
                    if (sActionName == "Activate") {
                        criModel.setProperty(oEvent.Path + "/JOB_STATUS", 'ACTIVE');
                    } else if (sActionName == "Deactivate") {
                        criModel.setProperty(oEvent.Path + "/JOB_STATUS", 'INACTIVE');
                    } else {
                        errorIds.push(oEvent.EventName);
                    }
                });

                if (errorIds.length > 0) {
                    jQuery.sap.require("sap.m.MessageBox");
                    MessageBox.show(
                        "Some events were not able to be changed: " + errorIds.join(', '), {
                            icon: MessageBox.Icon.ERROR,
                            title: "Unable to change event status",
                            actions: [MessageBox.Action.OK]
                        }
                    );
                }

                criModel.submitChanges();
            },
            filterEvents : function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                var filter = null;
                if (sQuery) {
                    var filterArray = [
                        new Filter("EVENT_NAME", FilterOperator.Contains, sQuery)
                    ];

                    filter = new Filter(filterArray, false);
                }

                var oTable = this.getView().byId("predefinedEventList");
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