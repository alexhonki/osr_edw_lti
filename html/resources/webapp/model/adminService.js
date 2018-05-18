sap.ui.define(["sap/ui/model/odata/ODataModel"], function (ODataModel) {
    "use strict";
    return {
        oETags: {},
        oBuckets: {
            AtRiskBucketSize: {
                ID: "RISK_BUCKET_SIZE",
                Value: 1
            },
            DataRetentionDays: {
                ID: "DATA_RETENTION_DAYS",
                Value: 1
            },
            DaysToReact: {
                ID: "DAYS_TO_REACT",
                Low: 1,
                Medium: 2,
                High: 3
            },
            ForecastWindow: {
                ID: "FORECAST_WINDOW",
                Value: 1
            },
            Impact: {
                ID: "IMPACT",
                Low: 1,
                Medium: 2,
                High: 3
            },
            ReactionDays: {
                ID: "REACTION_DAYS",
                Value: 1
            },
            ReactionType: {
                ID: "REACTION_TYPE"
            },
            Risk: {
                ID: "INFLUENCE",
                Low: 1,
                Medium: 2,
                High: 3
            },
            SoftChurn: {
                ID: "SOFT_CHURN",
                Value: 1
            },
            IncomeLoss: {
                ID: "INCOME_LOSS",
                Low: 1,
                Medium: 2,
                High: 3
            }
        },
        readSetting: function (model, setting, callback) {
            this.readConfig(model, setting.ID, setting.Value, {
                success: function (data) {
                    callback(data.FROM_VALUE, data.FROM_DEFAULT);
                }
            });
        },
        readBucket: function (model, bucket, callback) {
            this.readConfig(model, bucket.ID, bucket.Medium, {
                success: function (data) {
                    callback(data.FROM_VALUE, data.TO_VALUE, data.FROM_DEFAULT, data.TO_DEFAULT);
                }
            });
        },
        readValues: function (model, bucket, callback) {
            this.readBucketSequences(model, bucket.ID, {
                success: function (data) {
                    var values = [];
                    data.results.forEach(function (d) {
                       values.push({
                           key: d.SEQ,
                           displayText: d.STR_VALUE,
                           enabled: d.IS_ENABLED ? true : false
                       });
                    });
                    callback(values);
                }
            });
        },
        enableValue: function (model, bucket, enableId) {
            var that = this;
            this.readBucketSequences(model, bucket.ID, {
                success: function (data) {
                    data.results.forEach(function (d) {
                        that.updateConfig(model, bucket.ID, d.SEQ, {
                            IS_ENABLED: d.SEQ == enableId ? 1 : 0
                        });
                    });
                }
            });
        },
        updateSetting: function (model, setting, value, oParameters) {
            this.updateConfig(model, setting.ID, setting.Value,
                {
                    FROM_VALUE: value + "",
                    TO_VALUE: value + ""
                },
                oParameters
            );
        },
        updateBuckets: function (model, bucket, mediumThreshold, highThreshold, oParameters) {
            this.updateConfig(model, bucket.ID, bucket.Low,
                {
                    FROM_VALUE: "0",
                    TO_VALUE: mediumThreshold + ""
                },
                oParameters
            );

            this.updateConfig(model, bucket.ID, bucket.Medium,
                {
                    FROM_VALUE: mediumThreshold + "",
                    TO_VALUE: highThreshold + ""
                },
                oParameters
            );

            this.updateConfig(model, bucket.ID, bucket.High,
                {
                    FROM_VALUE: highThreshold + "",
                    TO_VALUE: "999999999"
                },
                oParameters
            );
        },
        readConfig: function (model, sBucketId, sBucketSequence, oParameters) {
            var oldSuccess = oParameters.success;
            oParameters.success = function (oData) {

                // Capture the current etag
                // Unfortuantely there doesn't seem to be a nicer way to get this at the moment
                this.oETags[sBucketId + ' ' + sBucketSequence] = oData.__metadata.etag;

                if (oldSuccess) {
                    oldSuccess(oData);
                }
            }.bind(this);

            model.setHeaders({"If-Match": "*"});
            model.read("/Config(BUCKET_ID='" + sBucketId + "',SEQ=" + sBucketSequence + ")", oParameters);
            model.setHeaders({});
        },
        readBucketSequences: function (model, sBucketId, oParameters) {
            var oldSuccess = oParameters.success;
            oParameters.success = function (oData) {
                if (oldSuccess) {
                    oldSuccess(oData);
                }
            };

            oParameters.filters = [new sap.ui.model.Filter("BUCKET_ID", sap.ui.model.FilterOperator.EQ, sBucketId)];

            model.read("/Config", oParameters);
        },
        updateConfig: function (model, sBucketId, sBucketSequence, oNewConfig, oOptionalParameters) {
            var oParameters = oOptionalParameters || {};
            oParameters.eTag = "*"; //PROBLEM SOLVED //this.oETags[sBucketId + ' ' + sBucketSequence];

            var oldError = oParameters.error;
            oParameters.error = function(oError) {
                if (oError.statusCode == 412) {
                    // Possible invalid etag, ask user to try again
                }

                if (oldError) {
                    oldError(oError);
                }
            };

            model.update("/Config(BUCKET_ID='" + sBucketId + "',SEQ=" + sBucketSequence + ")", oNewConfig, oParameters);
        }
    };
});