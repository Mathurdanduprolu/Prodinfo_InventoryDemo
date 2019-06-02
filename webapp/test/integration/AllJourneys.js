jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 MaterailsSet in the list
// * All 3 MaterailsSet have at least one MaterialToActualStock

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
		"z/stock/test/integration/MasterJourney",
		"z/stock/test/integration/NavigationJourney",
		"z/stock/test/integration/NotFoundJourney",
		"z/stock/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});