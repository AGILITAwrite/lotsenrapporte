jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"ch/portof/test/integration/NavigationJourneyPhone",
		"ch/portof/test/integration/NotFoundJourneyPhone",
		"ch/portof/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});