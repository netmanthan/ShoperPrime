// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.require("assets/shoperprime/js/sales_trends_filters.js", function() {
	frappe.query_reports["Sales Invoice Trends"] = {
		filters: shoperprime.get_sales_trends_filters()
	}
});
