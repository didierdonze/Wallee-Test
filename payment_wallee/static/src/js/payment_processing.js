odoo.define('payment_wallee.payment_processing', function (require) {
    "use strict";

    var publicWidget = require('web.public.widget');

	var PaymentProcessing = publicWidget.registry.PaymentProcessing;

	PaymentProcessing.include({
	    xmlDependencies: PaymentProcessing.prototype.xmlDependencies.concat(
	        ['/payment_wallee/static/src/xml/payment.xml']
	    ),
    });
});

