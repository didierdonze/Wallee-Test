# -*- coding: utf-8 -*-
# Part of PIT Solutions AG. See LICENSE file for full copyright and licensing details.

import logging
import pprint
from pprint import pformat
import werkzeug

from odoo import http
from odoo.http import request
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from datetime import datetime, timedelta
from odoo.addons.payment.controllers.portal import PaymentProcessing

_logger = logging.getLogger(__name__)


class WalleePaymentController(PaymentProcessing):

    @http.route(['/payment/wallee/payment_method/update'], type='json', auth='public')
    def wallee_update_payment_method(self, **kwargs):   
        result = {}
        request.session.update({'wallee_payment_method': {}})
        try:
            trans_id = kwargs.get('trans_id', None)
            method_id = kwargs.get('method_id', None)
            space_id = kwargs.get('space_id', None)
            trans_interface = kwargs.get('trans_interface', None)
            one_click_mode = kwargs.get('one_click_mode', None)
            payment_method_args = [method_id, space_id, trans_interface, one_click_mode]      
            if None in payment_method_args:
                raise Exception('We are unable to process your payment method (Wallee).')
            vals = {
                'trans_id': trans_id,
                'method_id': method_id,
                'space_id': space_id,
                'trans_interface': trans_interface,
                'one_click_mode': one_click_mode,
            }
            request.session["wallee_payment_method"] = vals
            result = {
                'success': True,
            }
        except Exception as e:
            error = str(e)
            result = {
                'success': False,
                'error': error,
            } 
            _logger.error("Error while processing wallee_update_payment_method exception \"%s\"", error)
        return result
    
    

    @http.route()
    def payment_status_poll(self):
        request.session.update({'wallee_payment_method': {}})        
        tx_ids_list = self.get_payment_transaction_ids()
        Transaction = request.env['payment.transaction']
        wallee_pending_states = Transaction._wallee_pending_states
        payment_transactions = Transaction.sudo().search([
            ('id', 'in', list(tx_ids_list)),
            ('date', '>=', (datetime.now() - timedelta(days=1)).strftime(DEFAULT_SERVER_DATETIME_FORMAT)),
            ('acquirer_id.provider','=', 'wallee'), 
            ('wallee_state','in', wallee_pending_states)
        ])
        for tx in payment_transactions:
            tx._wallee_form_validate(data={})        
        return super(WalleePaymentController, self).payment_status_poll()
    

class WalleeController(http.Controller):   
    
    _success_url = '/payment/wallee/success'
    _failed_url = '/payment/wallee/failed'
    _unexpected_url = '/payment/wallee/unexpected'
    _wallee_redirect_url = '/payment/wallee/redirect'

    @http.route([_wallee_redirect_url], type='http', auth='public', csrf=False)
    def wallee_form_redirect(self, **post):
        _logger.info(
            'Wallee: entering wallee_form_redirect with post data %s', pformat(post))
        wallee_tx_url = post.get('wallee_tx_url', self._failed_url)
        return werkzeug.utils.redirect(wallee_tx_url)

    @http.route([_success_url, _failed_url], type='http', auth='public', csrf=False)
    def wallee_form_feedback(self, txnId=None, **post):
        _logger.info(
            'Wallee: entering form_feedback with txnId  %s and post data %s', pformat(txnId), pformat(post))
        post.update({
            'txn_id': txnId,
        })
        try:
            request.env['payment.transaction'].sudo().form_feedback(post, 'wallee')
        except Exception as e:
            _logger.info("Something went wrong from wallee success wallee_form_feedback: %s" % (e,))
            return werkzeug.utils.redirect(self._unexpected_url)
        return werkzeug.utils.redirect('/payment/process')

    @http.route([_unexpected_url], type='http', auth='public', csrf=False, website=True)
    def wallee_unexpected_form_feedback(self, **post):
        _logger.info(
            'Wallee: entering wallee_unexpected_form_feedback with post data %s', pprint.pformat(post))
        return request.render("payment_wallee.wallee_payment_unexpected_error", {})
    
