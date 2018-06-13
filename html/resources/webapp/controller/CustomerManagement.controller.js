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
     * @param {sap.fiori.cri.controller.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, ErrorService, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.CustomerManagement", {
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
                var table = this.getView().byId("idCustomerListTable");
                var numSelectedRows = table.getSelectedIndices().length;
                var customerList = table.getSelectedIndices();
                var unblockCount = 0;
                var blockCount = 0;
                var toBeDeleteCount = 0;
                customerList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel().getProperty(context.getPath());
                    if(model){
                        if(model.STATUS == 1){
                            unblockCount++;
                        }else if(model.STATUS == 0){
                            blockCount++;
                            toBeDeleteCount++;
                        }
                    }
                });
                this.getView().getModel().setProperty("/BlockRowCount", blockCount);
                this.getView().getModel().setProperty("/UnblockRowCount", unblockCount);
                this.getView().getModel().setProperty("/ToBeDeletedeRowCount", toBeDeleteCount);
            },
            doBlock: function () {
                this.showDialog("Block", 0);
            },
            doUnblock: function () {
                this.showDialog("Unblock", 1);
            },
            doRestore: function () {
                this.showDialog("Restore");
            },
            doDelete: function () {
                this.showDialog("Delete", 2);
            },
            formatStatusLabel: function (sStatus) {
                if (sStatus == 0) {
                    return "Unblocked";
                } else if (sStatus == 1) {
                    return "Blocked";
                } else if (sStatus == 2) {
                    return "To Be Deleted";
                } else if (sStatus == 3){
                    return "Deleted";
                } else {
                    return "";
                }
            },
            formatStatusState:function (sStatus) {
                if (sStatus == 1) {
                  return "Warning";
                } else if (sStatus == 2) {
                  return "Error";
                } else if (sStatus == 0) {
                  return "Success";
                } else {
                  return "None";
                }
            },
            formatStatusIcon: function (sStatus) {
                if (sStatus == "Blocked") {
                    return "sap-icon://locked";
                }
                return "";
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
            },
            showDialog: function (sActionName, sActionValue) {
                var table = this.getView().byId("idCustomerListTable");
                var customerList = table.getSelectedIndices();
                var customerListData = [];
                customerList.forEach(function (index) {
                    var context = table.getContextByIndex(index);
                    var model = context.getModel().getProperty(context.getPath());
                    if((model.STATUS == sActionValue && sActionValue != 2 ) || (sActionName == "Delete" && model.STATUS == 0)){
                        customerListData.push({
                            CustomerId: model["CUST_ID"],
                            CustomerName: model["NAME"],
                            Status: model["STATUS"],
                            Data:model,
                            Path: context.getPath()
                        });
                }
                });

                var criModel = this.getView().getModel('CRI');

                this.getOwnerComponent().modifyCustomersDialog.open(this.getView(), customerListData, sActionName, function (aCustomerList) {
                    var errorIds = [];
                    aCustomerList.forEach(function (oCustomer) {
                        if (sActionName == "Unblock" && oCustomer.Status == 1) {
                            criModel.setProperty(oCustomer.Path + "/STATUS", 0);
                        } else if (sActionName == "Block" && oCustomer.Status == 0) {
                            criModel.setProperty(oCustomer.Path + "/STATUS", 1);
                        } else if (sActionName == "Delete" && oCustomer.Status == 0) {
                            criModel.setProperty(oCustomer.Path + "/STATUS", 2);
                        } else if (sActionName == "Restore" && oCustomer.Status == 2) {
                            criModel.setProperty(oCustomer.Path + "/STATUS", 0);
                        } else {
                            errorIds.push(oCustomer.CustomerId);
                        }
                    });

                    if (errorIds.length > 0) {
                        jQuery.sap.require("sap.m.MessageBox");
                        MessageBox.show(
                            "Some users were not able to be changed: " + errorIds.join(', '), {
                                icon: MessageBox.Icon.ERROR,
                                title: "Unable to change user status",
                                actions: [MessageBox.Action.OK]
                            }
                        );
                    }
					
					//send update request
                    table.setBusyIndicatorDelay(0);
                    table.setBusy(true);
                    criModel.submitChanges({
                        success: function(oEvent){
                            table.getBinding("rows").refresh(true); 
                            table.setBusy(false);
                        },
                        error: function(oError){
                        	table.setBusy(false);
                            ErrorService.raiseGenericError(oError);
                        }});

                    table.clearSelection();
                });
            }
        });
    });