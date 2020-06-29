# coding: utf-8
# Part of PIT Solutions AG. See LICENSE file for full copyright and licensing details.

import datetime
import logging
from odoo import fields, models, api, _

from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
_logger = logging.getLogger(__name__)

EXCEPTION_LOG_TYPE = {
    ('red', _("Danger")),
    ('olive', _("Warning")),
    ('gray', _("Info")),
    ('green', _("Success")),
}


class PaymentAcquirerLog(models.Model):
    _name = "payment.acquirer.log"
    _description = "Payment acquirer log details"
    _order = "id desc"

    name = fields.Char(string="Description", required=True)
    detail = fields.Html(string="Detail",)
    origin = fields.Char(string="Origin", default='wallee', readonly=True)
    type = fields.Selection(EXCEPTION_LOG_TYPE, string="Type",
                            default='gray', readonly=True, required=True)

    @api.model
    def clean_old_logging(self, days=90):
        """
        Function called by a cron to clean old loggings.
        @return: True
        """
        last_days = datetime.datetime.now() +\
            datetime.timedelta(days=-days)
        domain = [
            ('create_date', '<', last_days.strftime(
                DEFAULT_SERVER_DATETIME_FORMAT))
        ]
        logs = self.search(domain)
        logs.unlink()
        message = " %d logs are deleted" % (len(logs))
        return self._post_log({'name': message})

    @api.model
    def _post_log(self, vals):
        self.create(vals)
        self.env.cr.commit()
        
