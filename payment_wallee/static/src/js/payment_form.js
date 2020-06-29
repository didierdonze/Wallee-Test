odoo.define('payment_wallee.payment_form', function (require) {
	"use strict";

    var core = require('web.core');
    var ajax = require('web.ajax');
    var rpc = require("web.rpc");
    var time = require('web.time');
	var payment_form = require('payment.payment_form');
    var _t = core._t;
    
    
	payment_form.include({
        getAcquirerName: function (element) {
            return $(element).data('provider');
        },
		getWalleeTrans: function (element) {
            return $(element).data('wallee-trans-id');
        },
		getWalleeMethod: function (element) {
            return $(element).data('wallee-method-id');
        },
		getWalleeSpace: function (element) {
            return $(element).data('wallee-space-id');
        },
		getWalleeTransInterface: function (element) {
            return $(element).data('wallee-trans_interface');
        },
		getWalleeOneClickMode: function (element) {
            return $(element).data('wallee-one_click_mode');
        },        
        updateWalleeMethod: function (wallee_method) {
            var uri = '/payment/wallee/payment_method/update'
            var def = new $.Deferred();
        	/*ajax.jsonRpc(uri, 'call', wallee_method, {
            	async: false
            }).then(function (data) {
            	def.resolve({'data': data, 'error': false});
            }).guardedCatch(function (error, event) {
            	def.reject({'data': false, 'error': error});
            });*/
            var data = {
                    jsonrpc: "2.0",
                    method: 'call',
                    params: wallee_method,
                    id: Math.floor(Math.random() * 1000 * 1000 * 1000)
                };
            $.ajax(uri, _.extend({}, {async: false}, {
                url: uri,
                dataType: 'json',
                type: 'POST',
                data: JSON.stringify(data, time.date_to_utc),
                contentType: 'application/json'
            })).done(function (data) {
            	def.resolve({'data': data, 'error': false});
            }).fail(function (error, event) {
            	def.reject({'data': false, 'error': error});
            });
            return def;;
        },
        payEvent: function (ev) {            
            ev.preventDefault();            
            this.showLoading();
            var other_acquirer = true;
            var form = this.el;
            var checked_radio = this.$('input[type="radio"]:checked');
            var self = this;
            var button = ev.target;
            this.disableButton(button);
            if (checked_radio.length === 1) { 
	            checked_radio = checked_radio[0];
	            var acquirer_name = this.getAcquirerName(checked_radio);                
	            var trans_id = this.getWalleeTrans(checked_radio);
	            var method_id = this.getWalleeMethod(checked_radio);
	            var space_id = this.getWalleeSpace(checked_radio);
	            var trans_interface = this.getWalleeTransInterface(checked_radio);
	            var one_click_mode = this.getWalleeOneClickMode(checked_radio);
	            var wallee_method = {
	            		'trans_id': trans_id,
	                	'method_id': method_id,
	                	'space_id': space_id,
	                	'trans_interface': trans_interface,
	                	'one_click_mode': one_click_mode,                		
	            	}	
	            if (acquirer_name === 'wallee' && wallee_method){ 
	            	other_acquirer = false;
	            	this.updateWalleeMethod(wallee_method).done(function(result){
	            		//if (result.data.success) {
	                    if (result.data.result) {
	                        if ($.blockUI) {
	                        	$.unblockUI();
	                        }
	                        //return self._super.apply(self, arguments);
	                        return self._super(ev);
	                    }else{
	                        if ($.blockUI) {
	                        	$.unblockUI();
	                        }
	                    	self.displayError(
	                            _t('Server error'),
	                            _t("We are not able to process your payment method at the moment.</p>")
	                        );
	                        self.enableButton(button);
	                    }
	    			}).fail(function (error, event) {
	                    if ($.blockUI) {
	                    	$.unblockUI();
	                    }
	                    self.displayError(
	                        _t('Server error'),
	                        _t("We are not able to process your payment method at the moment.</p>")
	                    );
	                    self.enableButton(button);
	                });
	            }                
	        }
            if (other_acquirer) {
            	return this._super.apply(this, arguments);
            }
        },
        showLoading: function () {
            var msg = _t("We are processing your payments, please wait ...");
            $.blockUI({
                'message': '<h2 class="text-white"><img src="/web/static/src/img/spin.png" class="fa-pulse"/>' +
                    '    <br />' + msg +
                    '</h2>'
            });
        },
	
	});
	
});