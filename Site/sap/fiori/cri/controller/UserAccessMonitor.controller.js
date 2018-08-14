//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService ErrorService
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator FilterOperator
     * @returns {*} UserAccessMonitor Controller
     */
    function (BaseController, ErrorService, JSONModel, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.UserAccessMonitor", {
            /**
             * Controller init
             */
            onInit: function () {
                var today = new Date();
                var lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);

                var oJSONModel = new JSONModel({
                    AuditPolicies: [],
                    FromDate: lastMonth,
                    ToDate: today,
                    SelectedDateRangeKey: 1,
                    TimeRanges: [
                        {
                            Name: "1 Month",
                            NumMonths: 1
                        },
                        {
                            Name: "3 Months",
                            NumMonths: 3
                        },
                        {
                            Name: "6 Months",
                            NumMonths: 6
                        },
                        {
                            Name: "12 Months",
                            NumMonths: 12
                        },
                        {
                            Name: "Custom Date Range...",
                            NumMonths: 0
                        }
                    ]
                });
                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function () {
                this.loadLabels("UserAccessMonitor", "en-US");
            },
            onAfterRendering: function () {
                var model = this.getView().getModel();
                this.getView().getModel("CRI").read("/AuditLog", {
                    urlParameters: {
                        "$select": ["AUDIT_POLICY_NAME","AUDIT_POLICY_DESC"]
                    },
                    success: function (oData) {
                        try {
                            model.setProperty("/AuditPolicies", oData.results);
                            if(oData.results.length >  0){
                                model.setProperty("/SelectedPolicy", oData.results[0]["AUDIT_POLICY_NAME"]);
                                this.filterResults();
                            }
                            
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    }.bind(this),
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                });

            },
            onDateRangeComboChange: function (oEvent) {
                var oModel = this.getView().getModel();

                var selectedKey = oEvent.getParameter("selectedItem").getProperty("key");
                var useCustomDateRange = false;
                if (selectedKey == 0) {
                    useCustomDateRange = true;
                }
                oModel.setProperty("/UseCustomDateRange", useCustomDateRange);

                if (useCustomDateRange) { return; }

                var numMonths = parseInt(selectedKey, 10);
                if (!numMonths) { return; }

                var toDate = new Date();
                var fromDate = new Date();
                fromDate.setMonth(toDate.getMonth() - numMonths);

                oModel.setProperty("/FromDate", fromDate);
                oModel.setProperty("/ToDate", toDate);

                this.filterResults();
            },
            onDateRangeChange: function (oEvent) {
                var oModel = this.getView().getModel();

                var valid = oEvent.getParameter("valid");
                if (!valid) { return; }

                var fromDate = oEvent.getParameter("from");
                var toDate = oEvent.getParameter("to");

                oModel.setProperty("/FromDate", fromDate);
                oModel.setProperty("/ToDate", toDate);

                this.filterResults();
            },
            filterResults : function() {
                var oModel = this.getView().getModel();

                var policy = oModel.getProperty("/SelectedPolicy");

                var sQuery = oModel.getProperty("/FilterString");

                var filterArray = [
                    new Filter("AUDIT_POLICY_NAME", FilterOperator.EQ, policy)
                ];

                if (sQuery) {
                    var aQueryFilters = [new Filter("STATEMENT_STRING", FilterOperator.Contains, sQuery)];
                    aQueryFilters.push(new Filter("USER_NAME", FilterOperator.Contains, sQuery));

                    if (!isNaN(sQuery)){
                        aQueryFilters.push(new Filter("CUST_ID", FilterOperator.EQ, sQuery));
                    }
                    filterArray.push(new Filter(aQueryFilters, false));
                }

                var oFromDate = oModel.getProperty("/FromDate");
                var oToDate = oModel.getProperty("/ToDate");

                var fromFilter = new Filter("LOG_DATE", FilterOperator.GE, oFromDate);
                var toFilter = new Filter("LOG_DATE", FilterOperator.LE, oToDate);
                var dateFilter = new Filter([fromFilter, toFilter], true);
                filterArray.push(dateFilter);

                var filter;
                if (filterArray.length > 0) {
                    filter = new Filter(filterArray, true);
                }

                var oTable = this.getView().byId("idUserAccessListTable");
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