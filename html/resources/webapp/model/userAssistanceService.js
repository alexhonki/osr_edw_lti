sap.ui.define([], function () {
    "use strict";
    return {
        baseURL: "https://help.sap.com/doc/b8e2c87fb142479da87a72e423c5a860/2.0.0/en-US/",
        videoURL: "https://youtu.be/A4xPG15hOaU",
        pages:{
            Home: "index.html",
            CustomersAtRisk: "6c1c9ee609be4a308ffbc41436c05b70.html",
            CustomerPrediction: "bb4782b0d5b44211ab2f65b33b7f64d3.html",
            TrendAnalysis: "71f44e7942444469ab4f91cd10a195ea.html",
            EventAnalysis: "3cd41d0094bd4b3cb6e88406a290f456.html",
            FindCustomer: "8a23b5854a5b484e9104b40a963796a0.html",
            Search: "8a23b5854a5b484e9104b40a963796a0.html",
            AdminSettings: "45ba966cdb974b30a57740400bc25d1a.html",
            Settings: "e36c71111fe0487ebddec907ca532f8d.html"
        },

        canShowUserAssistance: function (sContextName) {
            return (sContextName && this.pages.hasOwnProperty(sContextName));
        },
        showUserAssistance: function (sContextName) {
            var page = this.pages["Home"];

            if (sContextName && sContextName == "SuperAdmin") {
                // Super Admin page is hosted on different endpoint
                var url = "https://help.sap.com/viewer/c00e17f25cb64621b0298f1f0d0c7990/1.0.0/en-US";
                window.open(url,"_blank");
                return;
            }

            if (this.canShowUserAssistance(sContextName)) {
                page = this.pages[sContextName] || page;
            }

            window.open(this.baseURL + page,"_blank");
        },
        showUserAssistanceVideo: function (sContextName) {
            window.open(this.videoURL,"_blank");
        }
    };
});