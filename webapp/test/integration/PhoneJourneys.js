jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"z/stock/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"z/stock/test/integration/pages/App",
	"z/stock/test/integration/pages/Browser",
	"z/stock/test/integration/pages/Master",
	"z/stock/test/integration/pages/Detail",
	"z/stock/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "z.stock.view."
	});

	sap.ui.require([
		"z/stock/test/integration/NavigationJourneyPhone",
		"z/stock/test/integration/NotFoundJourneyPhone",
		"z/stock/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});