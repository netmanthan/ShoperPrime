// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.query_reports["Accounts Receivable Summary"] = {
	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company")
		},
		{
			"fieldname":"report_date",
			"label": __("Posting Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname":"ageing_based_on",
			"label": __("Ageing Based On"),
			"fieldtype": "Select",
			"options": 'Posting Date\nDue Date',
			"default": "Due Date"
		},
		{
			"fieldname":"range1",
			"label": __("Ageing Range 1"),
			"fieldtype": "Int",
			"default": "30",
			"reqd": 1
		},
		{
			"fieldname":"range2",
			"label": __("Ageing Range 2"),
			"fieldtype": "Int",
			"default": "60",
			"reqd": 1
		},
		{
			"fieldname":"range3",
			"label": __("Ageing Range 3"),
			"fieldtype": "Int",
			"default": "90",
			"reqd": 1
		},
		{
			"fieldname":"range4",
			"label": __("Ageing Range 4"),
			"fieldtype": "Int",
			"default": "120",
			"reqd": 1
		},
		{
			"fieldname":"finance_book",
			"label": __("Finance Book"),
			"fieldtype": "Link",
			"options": "Finance Book"
		},
		{
			"fieldname":"cost_center",
			"label": __("Cost Center"),
			"fieldtype": "Link",
			"options": "Cost Center",
			get_query: () => {
				var company = frappe.query_report.get_filter_value('company');
				return {
					filters: {
						'company': company
					}
				}
			}
		},
		{
			"fieldname": "party_type",
			"label": __("Party Type"),
			"fieldtype": "Link",
			"options": "Party Type",
			"Default": "Customer",
			get_query: () => {
				return {
					filters: {
						'account_type': 'Receivable'
					}
				};
			},
			on_change: () => {
				frappe.query_report.set_filter_value('party', "");
				frappe.query_report.toggle_filter_display('customer_group', frappe.query_report.get_filter_value('party_type') !== "Customer");
			}
		},
		{
			"fieldname":"party",
			"label": __("Party"),
			"fieldtype": "Dynamic Link",
			"options": "party_type",
		},
		{
			"fieldname":"customer_group",
			"label": __("Customer Group"),
			"fieldtype": "Link",
			"options": "Customer Group"
		},
		{
			"fieldname":"payment_terms_template",
			"label": __("Payment Terms Template"),
			"fieldtype": "Link",
			"options": "Payment Terms Template"
		},
		{
			"fieldname":"territory",
			"label": __("Territory"),
			"fieldtype": "Link",
			"options": "Territory"
		},
		{
			"fieldname":"sales_partner",
			"label": __("Sales Partner"),
			"fieldtype": "Link",
			"options": "Sales Partner"
		},
		{
			"fieldname":"sales_person",
			"label": __("Sales Person"),
			"fieldtype": "Link",
			"options": "Sales Person"
		},
		{
			"fieldname":"based_on_payment_terms",
			"label": __("Based On Payment Terms"),
			"fieldtype": "Check",
		},
		{
			"fieldname":"show_future_payments",
			"label": __("Show Future Payments"),
			"fieldtype": "Check",
		},
		{
			"fieldname":"show_gl_balance",
			"label": __("Show GL Balance"),
			"fieldtype": "Check",
		},
	],

	onload: function(report) {
		report.page.add_inner_button(__("Accounts Receivable"), function() {
			var filters = report.get_values();
			frappe.set_route('query-report', 'Accounts Receivable', { company: filters.company });
		});
	}
}

shoperprime.utils.add_dimensions('Accounts Receivable Summary', 9);