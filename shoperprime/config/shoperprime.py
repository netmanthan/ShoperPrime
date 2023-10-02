from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("shoperprime POS"),
			"items": [
				 {
				   "description": "ShoperPrime POS",
				   "name": "shoperprimepos",
				   "label": "ShoperPrime POS",
				   "type": "page"
				  }, 

				{
				   "type": "doctype", 
				   "description": "POS Profile", 
				   "name": "POS Profile", 
				  },

				{
				   "type": "doctype", 
				   "description": "POS Opening Shift", 
				   "name": "POS Opening Shift", 
				  },
				{
				   "type": "doctype", 
				   "description": "POS Closing Shift", 
				   "name": "POS Closing Shift", 
				  },
				{
				   "type": "doctype", 
				   "description": "POS Offers", 
				   "name": "POS Offer", 
				  },
            ]

        }
	]
