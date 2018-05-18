//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.m.MessageBox} MessageBox Message Box
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, ErrorService, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.EventManagement", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel();
                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function () {
                
            },
            onAfterRendering: function () {
                
            },
            onRowSelectionChange: function () {
                var table = this.getView().byId("idEventListTable");
                var numSelectedRows = table.getSelectedIndices().length;
                var eventList = table.getSelectedIndices();
                var eventListData = [];
                var deactivateCount = 0;
                var activateCount = 0;
                eventList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel().getProperty(context.getPath());
                    if(model){
                        if(model.IS_ENABLED){
                            deactivateCount++;
                        }else{
                            activateCount++;
                        }
                    }
                });
                this.getView().getModel().setProperty("/SelectedActivateRowCount", activateCount);
                this.getView().getModel().setProperty("/SelectedDeactivateRowCount", deactivateCount);
            },
            doActivate: function () {
                this.showDialog("Activate", 0);
            },
            doDeactivate: function () {
                this.showDialog("Deactivate", 1);
            },
            formatStatusLabel: function (sStatus) {
                if (sStatus == 0) {
                    return "Deactivated";
                } else if (sStatus == 1) {
                    return "Activated";
                } else {
                    return sStatus;
                }
            },
            formatStatusState:function (sStatus) {
                if (sStatus == 0) {
                    return "Error";
                } else if (sStatus == 1) {
                    return "Success";
                } else {
                    return "None";
                }
            },
            formatStatusIcon: function (sStatus) {
                if (sStatus == 0) {
                    return "sap-icon://hide";
                } else if (sStatus == 1) {
                    return "sap-icon://show";
                } else {
                    return "";
                }
            },
            filterEvents : function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                var filter = null;
                if (sQuery) {
                    var filterArray = [
                        new Filter("EVENT_NAME", FilterOperator.Contains, sQuery),
                        new Filter("CATEGORY_NAME", FilterOperator.Contains, sQuery)
                    ];

                    filter = new Filter(filterArray, false);
                }

                var oTable = this.getView().byId("idEventListTable");
                oTable.setBusyIndicatorDelay(0);
                oTable.setBusy(true);

                var oBinding = oTable.getBinding("rows");
                oBinding.attachDataReceived(function () {
                    oTable.setBusy(false);
                    oBinding.detachDataReceived(this);
                });

                oBinding.filter(filter, "Application");
            },
            showDialog: function (sActionName, sActionValue) {
                var table = this.getView().byId("idEventListTable");

                var eventList = table.getSelectedIndices();
                var eventListData = [];
                eventList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel().getProperty(context.getPath());
                    if(model.IS_ENABLED == sActionValue){
                        eventListData.push({
                            EventName: model["EVENT_NAME"],
                            EventCategory: model["CATEGORY_NAME"],
                            Enabled: model["IS_ENABLED"],
                            Data: model,
                            Path: context.getPath()
                        });
                }
                });

                var criModel = this.getView().getModel('CRI');

                this.getOwnerComponent().modifyEventsDialog.open(this.getView(), eventListData, sActionName, function (aEventList) {
                    var errorIds = [];
                    var sPath, oEventData = {};
                    aEventList.forEach(function (oEvent) {
                        if (sActionName == "Activate" && oEvent.Enabled == 0) {
                            criModel.setProperty(oEvent.Path + "/IS_ENABLED", 1);
                        } else if (sActionName == "Deactivate" && oEvent.Enabled == 1) {
                            criModel.setProperty(oEvent.Path + "/IS_ENABLED", 0);
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
                    //send update request
                    table.setBusyIndicatorDelay(0);
                    table.setBusy(true);
                    criModel.submitChanges({
				        success: function(response){ 
                            table.getBinding("rows").refresh(true);
                            table.setBusy(false);
                        },
				        error: function(oError){
				        	table.setBusy(false);
                            ErrorService.raiseGenericError(oError);
                        }
                        });

                    table.clearSelection();
                    
                });
            }
        });
    });