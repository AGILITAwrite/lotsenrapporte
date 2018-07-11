jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SchiffeSet in the list
// * All 3 SchiffeSet have at least one RapporteSet

sap.ui.require([
	"sap/ui/test/Opa5",
	"ch/portof/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"ch/portof/test/integration/pages/App",
	"ch/portof/test/integration/pages/Browser",
	"ch/portof/test/integration/pages/Master",
	"ch/portof/test/integration/pages/Detail",
	"ch/portof/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "ch.portof.view."
	});

	sap.ui.require([
		"ch/portof/test/integration/MasterJourney",
		"ch/portof/test/integration/NavigationJourney",
		"ch/portof/test/integration/NotFoundJourney",
		"ch/portof/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});