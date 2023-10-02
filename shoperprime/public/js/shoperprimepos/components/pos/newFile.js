import { evntBus } from "../../bus";
import format from "../../format";

export default (await import('vue')).defineComponent({
mixins: [format],
data: () => ({
loading: false,
pos_profile: "",
invoice_doc: "",
loyalty_amount: 0,
is_credit_sale: 0,
is_write_off_change: 0,
date_menu: false,
po_date_menu: false,
addresses: [],
sales_persons: [],
sales_person: "",
paid_change: 0,
order_delivery_date: false,
paid_change_rules: [],
is_return: false,
is_cashback: true,
redeem_customer_credit: false,
customer_credit_dict: [],
phone_dialog: false,
invoiceType: "Invoice",
pos_settings: "",
customer_info: "",
mpesa_modes: [],
}),

methods: {
back_to_invoice() {
evntBus.$emit("show_payment", "false");
evntBus.$emit("set_customer_readonly", false);
},
submit(event, payment_received = false, print = false) {
if (!this.invoice_doc.is_return && this.total_payments < 0) {
evntBus.$emit("show_mesage", {
text: `Payments not correct`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}
// validate phone payment
let phone_payment_is_valid = true;
if (!payment_received) {
this.invoice_doc.payments.forEach((payment) => {
if (payment.type == "Phone" &&
![0, "0", "", null, undefined].includes(payment.amount)) {
phone_payment_is_valid = false;
}
});
if (!phone_payment_is_valid) {
evntBus.$emit("show_mesage", {
text: __(
"Please request phone payment or use other payment method"
),
color: "error",
});
frappe.utils.play_sound("error");
console.error("phone payment not requested");
return;
}
}

if (!this.pos_profile.posa_allow_partial_payment &&
this.total_payments <
(this.invoice_doc.rounded_total || this.invoice_doc.grand_total)) {
evntBus.$emit("show_mesage", {
text: `The amount paid is not complete`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

if (this.pos_profile.posa_allow_partial_payment &&
!this.pos_profile.posa_allow_credit_sale &&
this.total_payments == 0) {
evntBus.$emit("show_mesage", {
text: `Please enter the amount paid`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

if (!this.paid_change) this.paid_change = 0;

if (this.paid_change > -this.diff_payment) {
evntBus.$emit("show_mesage", {
text: `Paid change can not be greater than total change!`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

let total_change = this.flt(
this.flt(this.paid_change) + this.flt(-this.credit_change)
);

if (this.is_cashback && total_change != -this.diff_payment) {
evntBus.$emit("show_mesage", {
text: `Error in change calculations!`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

let credit_calc_check = this.customer_credit_dict.filter((row) => {
if (flt(row.credit_to_redeem))
return flt(row.credit_to_redeem) > flt(row.total_credit);
else return false;
});

if (credit_calc_check.length > 0) {
evntBus.$emit("show_mesage", {
text: `redeamed credit can not greater than its total.`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

if (!this.invoice_doc.is_return &&
this.redeemed_customer_credit >
(this.invoice_doc.rounded_total || this.invoice_doc.grand_total)) {
evntBus.$emit("show_mesage", {
text: `can not redeam customer credit more than invoice total`,
color: "error",
});
frappe.utils.play_sound("error");
return;
}

this.submit_invoice(print);
this.customer_credit_dict = [];
this.redeem_customer_credit = false;
this.is_cashback = true;
this.sales_person = "";

evntBus.$emit("new_invoice", "false");
this.back_to_invoice();
},
submit_invoice(print) {
let totalPayedAmount = 0;
this.invoice_doc.payments.forEach((payment) => {
payment.amount = flt(payment.amount);
totalPayedAmount += payment.amount;
});
if (this.invoice_doc.is_return && totalPayedAmount == 0) {
this.invoice_doc.is_pos = 0;
}
if (this.customer_credit_dict.length) {
this.customer_credit_dict.forEach((row) => {
row.credit_to_redeem = flt(row.credit_to_redeem);
});
}
let data = {};
data["total_change"] = !this.invoice_doc.is_return
? -this.diff_payment
: 0;
data["paid_change"] = !this.invoice_doc.is_return ? this.paid_change : 0;
data["credit_change"] = -this.credit_change;
data["redeemed_customer_credit"] = this.redeemed_customer_credit;
data["customer_credit_dict"] = this.customer_credit_dict;
data["is_cashback"] = this.is_cashback;

const vm = this;
frappe.call({
method: "shoperprimepos.shoperprimepos.api.shoperprimepos.submit_invoice",
args: {
data: data,
invoice: this.invoice_doc,
},
async: true,
callback: function (r) {
if (r.message) {
if (print) {
vm.load_print_page();
}
evntBus.$emit("set_last_invoice", vm.invoice_doc.name);
evntBus.$emit("show_mesage", {
text: `Invoice ${r.message.name} is Submited`,
color: "success",
});
frappe.utils.play_sound("submit");
this.addresses = [];
}
},
});
},
set_full_amount(idx) {
this.invoice_doc.payments.forEach((payment) => {
payment.amount =
payment.idx == idx
? this.invoice_doc.rounded_total || this.invoice_doc.grand_total
: 0;
});
},
set_rest_amount(idx) {
this.invoice_doc.payments.forEach((payment) => {
if (payment.idx == idx &&
payment.amount == 0 &&
this.diff_payment > 0) {
payment.amount = this.diff_payment;
}
});
},
clear_all_amounts() {
this.invoice_doc.payments.forEach((payment) => {
payment.amount = 0;
});
},
load_print_page() {
const print_format = this.pos_profile.print_format_for_online ||
this.pos_profile.print_format;
const letter_head = this.pos_profile.letter_head || 0;
const url = frappe.urllib.get_base_url() +
"/printview?doctype=Sales%20Invoice&name=" +
this.invoice_doc.name +
"&trigger_print=1" +
"&format=" +
print_format +
"&no_letterhead=" +
letter_head;
const printWindow = window.open(url, "Print");
printWindow.addEventListener(
"load",
function () {
printWindow.print();
printWindow.close();
// NOTE : comment or uncomoent this to auto closing printing window above line i.e (printWindow.close();) //Jawahar R M
},
true
);
},
validate_due_date() {
const today = frappe.datetime.now_date();
const parse_today = Date.parse(today);
const new_date = Date.parse(this.invoice_doc.due_date);
if (new_date < parse_today) {
setTimeout(() => {
this.invoice_doc.due_date = today;
}, 0);
}
},
shortPay(e) {
if (e.key === "F7") {
e.preventDefault();
this.submit();
}
},
set_paid_change() {
if (!this.paid_change) this.paid_change = 0;

this.paid_change_rules = [];
let change = -this.diff_payment;
if (this.paid_change > change) {
this.paid_change_rules = [
"Paid change can not be greater than total change!",
];
this.credit_change = 0;
}
},
get_available_credit(e) {
this.clear_all_amounts();
if (e) {
frappe
.call("shoperprimepos.shoperprimepos.api.shoperprimepos.get_available_credit", {
customer: this.invoice_doc.customer,
company: this.pos_profile.company,
})
.then((r) => {
const data = r.message;
if (data.length) {
const amount = this.invoice_doc.rounded_total || this.invoice_doc.grand_total;
let remainAmount = amount;

data.forEach((row) => {
if (remainAmount > 0) {
if (remainAmount >= row.total_credit) {
row.credit_to_redeem = row.total_credit;
remainAmount = remainAmount - row.total_credit;
} else {
row.credit_to_redeem = remainAmount;
remainAmount = 0;
}
} else {
row.credit_to_redeem = 0;
}
});

this.customer_credit_dict = data;
} else {
this.customer_credit_dict = [];
}
});
} else {
this.customer_credit_dict = [];
}
},
get_addresses() {
const vm = this;
if (!vm.invoice_doc) {
return;
}
frappe.call({
method: "shoperprimepos.shoperprimepos.api.shoperprimepos.get_customer_addresses",
args: { customer: vm.invoice_doc.customer },
async: true,
callback: function (r) {
if (!r.exc) {
vm.addresses = r.message;
} else {
vm.addresses = [];
}
},
});
},
addressFilter(item, queryText, itemText) {
const textOne = item.address_title
? item.address_title.toLowerCase()
: "";
const textTwo = item.address_line1
? item.address_line1.toLowerCase()
: "";
const textThree = item.address_line2
? item.address_line2.toLowerCase()
: "";
const textFour = item.city ? item.city.toLowerCase() : "";
const textFifth = item.name.toLowerCase();
const searchText = queryText.toLowerCase();
return (
textOne.indexOf(searchText) > -1 ||
textTwo.indexOf(searchText) > -1 ||
textThree.indexOf(searchText) > -1 ||
textFour.indexOf(searchText) > -1 ||
textFifth.indexOf(searchText) > -1
);
},
new_address() {
evntBus.$emit("open_new_address", this.invoice_doc.customer);
},
get_sales_person_names() {
const vm = this;
if (vm.pos_profile.posa_local_storage &&
localStorage.sales_persons_storage) {
vm.sales_persons = JSON.parse(
localStorage.getItem("sales_persons_storage")
);
}
frappe.call({
method: "shoperprimepos.shoperprimepos.api.shoperprimepos.get_sales_person_names",
callback: function (r) {
if (r.message) {
vm.sales_persons = r.message;
if (vm.pos_profile.posa_local_storage) {
localStorage.setItem("sales_persons_storage", "");
localStorage.setItem(
"sales_persons_storage",
JSON.stringify(r.message)
);
}
}
},
});
},
salesPersonFilter(item, queryText, itemText) {
const textOne = item.sales_person_name
? item.sales_person_name.toLowerCase()
: "";
const textTwo = item.name.toLowerCase();
const searchText = queryText.toLowerCase();

return (
textOne.indexOf(searchText) > -1 || textTwo.indexOf(searchText) > -1
);
},
request_payment() {
this.phone_dialog = false;
const vm = this;
if (!this.invoice_doc.contact_mobile) {
evntBus.$emit("show_mesage", {
text: __(`Pleas Set Customer Mobile Number`),
color: "error",
});
evntBus.$emit("open_edit_customer");
this.back_to_invoice();
return;
}
evntBus.$emit("freeze", {
title: __(`Waiting for payment... `),
});
this.invoice_doc.payments.forEach((payment) => {
payment.amount = flt(payment.amount);
});
let formData = { ...this.invoice_doc };
formData["total_change"] = -this.diff_payment;
formData["paid_change"] = this.paid_change;
formData["credit_change"] = -this.credit_change;
formData["redeemed_customer_credit"] = this.redeemed_customer_credit;
formData["customer_credit_dict"] = this.customer_credit_dict;
formData["is_cashback"] = this.is_cashback;

frappe
.call({
method: "shoperprimepos.shoperprimepos.api.shoperprimepos.update_invoice",
args: {
data: formData,
},
async: false,
callback: function (r) {
if (r.message) {
vm.invoice_doc = r.message;
}
},
})
.then(() => {
frappe
.call({
method: "shoperprimepos.shoperprimepos.api.shoperprimepos.create_payment_request",
args: {
doc: vm.invoice_doc,
},
})
.fail(() => {
evntBus.$emit("unfreeze");
evntBus.$emit("show_mesage", {
text: __(`Payment request failed`),
color: "error",
});
})
.then(({ message }) => {
const payment_request_name = message.name;
setTimeout(() => {
frappe.db
.get_value("Payment Request", payment_request_name, [
"status",
"grand_total",
])
.then(({ message }) => {
if (message.status != "Paid") {
evntBus.$emit("unfreeze");
evntBus.$emit("show_mesage", {
text: __(
`Payment Request took too long to respond. Please try requesting for payment again`
),
color: "error",
});
} else {
evntBus.$emit("unfreeze");
evntBus.$emit("show_mesage", {
text: __("Payment of {0} received successfully.", [
vm.formtCurrency(
message.grand_total,
vm.invoice_doc.currency,
0
),
]),
color: "success",
});
frappe.db
.get_doc("Sales Invoice", vm.invoice_doc.name)
.then((doc) => {
vm.invoice_doc = doc;
vm.submit(null, true);
});
}
});
}, 30000);
});
});
},
get_mpesa_modes() {
const vm = this;
frappe.call({
method: "shoperprimepos.shoperprimepos.api.m_pesa.get_mpesa_mode_of_payment",
args: { company: vm.pos_profile.company },
async: true,
callback: function (r) {
if (!r.exc) {
vm.mpesa_modes = r.message;
} else {
vm.mpesa_modes = [];
}
},
});
},
is_mpesa_c2b_payment(payment) {
if (this.mpesa_modes.includes(payment.mode_of_payment) &&
payment.type == "Bank") {
payment.amount = 0;
return true;
} else {
return false;
}
},
mpesa_c2b_dialg(payment) {
const data = {
company: this.pos_profile.company,
mode_of_payment: payment.mode_of_payment,
customer: this.invoice_doc.customer,
};
evntBus.$emit("open_mpesa_payments", data);
},
set_mpesa_payment(payment) {
this.pos_profile.use_customer_credit = 1;
this.redeem_customer_credit = true;
const advance = {
type: "Advance",
credit_origin: payment.name,
total_credit: flt(payment.unallocated_amount),
credit_to_redeem: flt(payment.unallocated_amount),
};
this.clear_all_amounts();
this.customer_credit_dict.push(advance);
},
},

computed: {
total_payments() {
let total = parseFloat(this.invoice_doc.loyalty_amount);
if (this.invoice_doc && this.invoice_doc.payments) {
this.invoice_doc.payments.forEach((payment) => {
total += this.flt(payment.amount);
});
}

total += this.flt(this.redeemed_customer_credit);

if (!this.is_cashback) total = 0;

return this.flt(total, this.currency_precision);
},
diff_payment() {
let diff_payment = this.flt(
(this.invoice_doc.rounded_total || this.invoice_doc.grand_total) -
this.total_payments,
this.currency_precision
);
this.paid_change = -diff_payment;
return diff_payment;
},
credit_change() {
let change = -this.diff_payment;
if (this.paid_change > change) return 0;
return this.flt(this.paid_change - change, this.currency_precision);
},
diff_lable() {
let lable = this.diff_payment < 0 ? "Change" : "To Be Paid";
return lable;
},
available_pioints_amount() {
let amount = 0;
if (this.customer_info.loyalty_points) {
amount =
this.customer_info.loyalty_points *
this.customer_info.conversion_factor;
}
return amount;
},
available_customer_credit() {
let total = 0;
this.customer_credit_dict.map((row) => {
total += row.total_credit;
});

return total;
},
redeemed_customer_credit() {
let total = 0;
this.customer_credit_dict.map((row) => {
if (flt(row.credit_to_redeem)) total += flt(row.credit_to_redeem);
else row.credit_to_redeem = 0;
});

return total;
},
vaildatPayment() {
if (this.pos_profile.posa_allow_sales_order) {
if (this.invoiceType == "Order" &&
!this.invoice_doc.posa_delivery_date) {
return true;
} else {
return false;
}
} else {
return false;
}
},
request_payment_field() {
let res = false;
if (!this.pos_settings || this.pos_settings.invoice_fields.length == 0) {
res = false;
} else {
this.pos_settings.invoice_fields.forEach((el) => {
if (el.fieldtype == "Button" &&
el.fieldname == "request_for_payment") {
res = true;
}
});
}
return res;
},
},

mounted: function () {
this.$nextTick(function () {
evntBus.$on("send_invoice_doc_payment", (invoice_doc) => {
this.invoice_doc = invoice_doc;
const default_payment = this.invoice_doc.payments.find(
(payment) => payment.default == 1
);
this.is_credit_sale = 0;
this.is_write_off_change = 0;
if (default_payment && !invoice_doc.is_return) {
default_payment.amount = this.flt(
invoice_doc.rounded_total || invoice_doc.grand_total,
this.currency_precision
);
}
if (invoice_doc.is_return) {
this.is_return = true;
invoice_doc.payments.forEach((payment) => {
payment.amount = 0;
payment.base_amount = 0;
});
}
this.loyalty_amount = 0;
this.get_addresses();
this.get_sales_person_names();
});
evntBus.$on("register_pos_profile", (data) => {
this.pos_profile = data.pos_profile;
this.get_mpesa_modes();
});
evntBus.$on("add_the_new_address", (data) => {
this.addresses.push(data);
this.$forceUpdate();
});
evntBus.$on("update_invoice_type", (data) => {
this.invoiceType = data;
if (this.invoice_doc && data != "Order") {
this.invoice_doc.posa_delivery_date = null;
this.invoice_doc.posa_notes = null;
this.invoice_doc.shipping_address_name = null;
}
});
});
evntBus.$on("update_customer", (customer) => {
if (this.customer != customer) {
this.customer_credit_dict = [];
this.redeem_customer_credit = false;
this.is_cashback = true;
}
});
evntBus.$on("set_pos_settings", (data) => {
this.pos_settings = data;
});
evntBus.$on("set_customer_info_to_edit", (data) => {
this.customer_info = data;
});
evntBus.$on("set_mpesa_payment", (data) => {
this.set_mpesa_payment(data);
});
},
created() {
document.addEventListener("keydown", this.shortPay.bind(this));
},
beforeDestroy() {
evntBus.$off("send_invoice_doc_payment");
evntBus.$off("register_pos_profile");
evntBus.$off("add_the_new_address");
evntBus.$off("update_invoice_type");
evntBus.$off("update_customer");
evntBus.$off("set_pos_settings");
evntBus.$off("set_customer_info_to_edit");
evntBus.$off("update_invoice_coupons");
evntBus.$off("set_mpesa_payment");
},

destroyed() {
document.removeEventListener("keydown", this.shortPay);
},

watch: {
loyalty_amount(value) {
if (value > this.available_pioints_amount) {
this.invoice_doc.loyalty_amount = 0;
this.invoice_doc.redeem_loyalty_points = 0;
this.invoice_doc.loyalty_points = 0;
evntBus.$emit("show_mesage", {
text: `Loyalty Amount can not be more then ${this.available_pioints_amount}`,
color: "error",
});
} else {
this.invoice_doc.loyalty_amount = this.flt(this.loyalty_amount);
this.invoice_doc.redeem_loyalty_points = 1;
this.invoice_doc.loyalty_points =
this.flt(this.loyalty_amount) / this.customer_info.conversion_factor;
}
},
is_credit_sale(value) {
if (value == 1) {
this.invoice_doc.payments.forEach((payment) => {
payment.amount = 0;
payment.base_amount = 0;
});
}
},
is_write_off_change(value) {
if (value == 1) {
this.invoice_doc.write_off_amount = this.diff_payment;
this.invoice_doc.write_off_outstanding_amount_automatically = 1;
} else {
this.invoice_doc.write_off_amount = 0;
this.invoice_doc.write_off_outstanding_amount_automatically = 0;
}
},
redeemed_customer_credit(value) {
if (value > this.available_customer_credit) {
evntBus.$emit("show_mesage", {
text: `You can redeem customer credit upto ${this.available_customer_credit}`,
color: "error",
});
}
},
sales_person() {
if (this.sales_person) {
this.invoice_doc.sales_team = [
{
sales_person: this.sales_person,
allocated_percentage: 100,
},
];
} else {
this.invoice_doc.sales_team = [];
}
},
},
});
