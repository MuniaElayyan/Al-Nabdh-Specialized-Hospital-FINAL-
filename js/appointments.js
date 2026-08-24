// صفحة المواعيد: النموذج وأدوات التصفية والجدول مكتوبين داخل appointments.html،
// وهذا الملف بيعبّي قائمة المرضى وصفوف الجدول وبيمرّر كل حفظ من appointment-rules.js.

import { initPage, refreshAlerts } from "./layout.js";
import { getPatients, getAppointmentsWithPatients } from "./api.js";
import { deleteAppointment, addActivity, onDataChange } from "./storage.js";
import { createAppointment, saveAppointmentEdit, checkAppointment, AppointmentRuleError } from "./appointment-rules.js";
import { openEditPanel, closeEditPanel } from "./edit-panel.js";
import {
appointmentBadge,
editRowButton,
lockedRowNote,
confirmDialog,
showToast,
setFieldError,
setFieldInvalid,
limitToFutureSlots,
renderIcons
} from "./ui.js";
import {
escapeHtml,
formatDate,
formatTime,
todayIso,
normalizeTime,
isUpcomingAppointment,
summarizeAppointments,
appointmentStatuses,
roles
} from "./helpers.js";

let allPatients = [];
let allAppointments = [];
let editingId = "";

const filters = { query: "", status: "All", date: "" };

// أسماء الحقول بالنموذج مطابقة لمفاتيح الأخطاء الراجعة من التحقق،
// فبنربط بينهم بجدول واحد بدل ما نكتب كل رسالة بمكانها
const formFieldIds = {
patientId: "appointmentPatient",
date: "appointmentDate",
time: "appointmentTime",
status: "appointmentStatus",
reason: "appointmentReason"
};

// نموذج الإضافة: بنعبّي قائمة المرضى، بنضبط أقدم تاريخ وأقدم ساعة مسموحين، وبنقرأ قيم الحقول وبنعرض أخطاءها تحت كل حقل

// قائمة المرضى بتتغير مع كل تسجيل جديد، فبنبنيها من البيانات
function fillPatientOptions() {
const select = document.getElementById("appointmentPatient");
const selectedId = select.value;

select.innerHTML = `<option value="">اختر المريض</option>${allPatients.map((patient) => `<option value="${escapeHtml(patient.id)}">${escapeHtml(patient.name)}</option>`).join("")}`;
select.value = selectedId;
}

// دالة ضبط حدود التاريخ والوقت لنموذج الإضافة. بتتظبط وقت ربط الأحداث، وبنحتفظ فيها
// هون عشان نعيد استدعاءها بعد ما نفضّي النموذج — لأن التفضية بترجّع الحقول فاضية.
let syncSlotLimits = () => {};

function readFormValues() {
return {
patientId: document.getElementById("appointmentPatient").value,
doctorId: "1",
date: document.getElementById("appointmentDate").value,
time: normalizeTime(document.getElementById("appointmentTime").value),
status: document.getElementById("appointmentStatus").value,
reason: document.getElementById("appointmentReason").value.trim()
};
}

// بنفضّي كل الرسائل وبعدين بنعرض اللي وصلنا، فما بتضل رسالة قديمة معلّقة
function showFormErrors(errors = {}) {
Object.entries(formFieldIds).forEach(([field, elementId]) => {
const message = errors[field] || "";

setFieldError(`${elementId}Error`, message);
setFieldInvalid(document.getElementById(elementId), Boolean(message));
});
}

function resetForm() {
document.getElementById("appointmentForm").reset();
showFormErrors({});
syncSlotLimits();
}

// التصفية: بنقرأ اللي اختاره المستخدم بالفلاتر أو اللي إجا جاهز بالرابط، وبنرجّع المواعيد المطابقة بس — بلا ما نلمس أي بيانات محفوظة

// بنقدر نفتح الصفحة مفلترة على طول: appointments.html?filter=today أو ?status=عاجل
function applyUrlFilter() {
const params = new URLSearchParams(window.location.search);

if (params.get("filter") === "today") {
filters.date = todayIso();
document.getElementById("appointmentDateFilter").value = filters.date;
}

const requestedStatus = params.get("status");

if (Object.values(appointmentStatuses).includes(requestedStatus)) {
filters.status = requestedStatus;
document.getElementById("appointmentStatusFilter").value = requestedStatus;
}
}

function getVisibleAppointments() {
const query = filters.query.trim().toLowerCase();

return allAppointments.filter((appointment) => {
const patientName = appointment.patient ? appointment.patient.name : "";
const searchText = `${patientName} ${appointment.reason}`.toLowerCase();

const matchesQuery = query === "" || searchText.includes(query);
const matchesStatus = filters.status === "All" || appointment.status === filters.status;
const matchesDate = filters.date === "" || appointment.date === filters.date;

return matchesQuery && matchesStatus && matchesDate;
});
}

// العرض: بنكتب أرقام البطاقات التلاتة، وبنبني صفوف الجدول من المواعيد الظاهرة بعد التصفية

// نفس الدالة اللي بتستعملها لوحة التحكم، فالأرقام بالشاشتين ما بتختلف
function fillSummary() {
const summary = summarizeAppointments(allAppointments);

document.querySelector('[data-stat="today"]').textContent = String(summary.today);
document.querySelector('[data-stat="upcoming"]').textContent = String(summary.upcoming);
document.querySelector('[data-stat="urgent"]').textContent = String(summary.urgent);
document.querySelector('[data-stat-note="upcoming"]').textContent = `${summary.past} موعد سابق في السجل`;
}

function renderAppointments() {
const appointments = getVisibleAppointments();
const table = document.getElementById("appointmentsTable");
const empty = document.getElementById("appointmentsEmpty");
const hasResults = appointments.length > 0;

document.getElementById("appointmentsCount").textContent = `عدد المواعيد: ${appointments.length} من ${allAppointments.length}`;

table.classList.toggle("hidden", !hasResults);
empty.classList.toggle("hidden", hasResults);

document.getElementById("appointmentsRows").innerHTML = appointments
.map((appointment) => {
const patientName = appointment.patient ? appointment.patient.name : "";
const isTodayRow = appointment.date === todayIso();
// الموعد اللي فات وقته بينوسم، عشان يبين ليش عدد «المواعيد القادمة» أقل من صفوف الجدول
const isPastRow = !isUpcomingAppointment(appointment) && appointment.status !== appointmentStatuses.completed;
// مواعيد ملف المستشفى ثابتة، واللي بيضيفه الطاقم بينعدّل
const actions = appointment.isSaved ? editRowButton(appointment.id) : lockedRowNote("سجل ثابت");

return `
<tr class="${appointment.id === editingId ? "bg-teal-50" : ""} ${isTodayRow ? "bg-teal-50/40" : ""}">
<td class="whitespace-nowrap px-4 py-3">
<a href="patient-details.html?id=${encodeURIComponent(appointment.patientId)}" class="font-semibold text-slate-900 transition duration-300 hover:text-teal-700">${escapeHtml(patientName)}</a>
</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">
${escapeHtml(formatDate(appointment.date))}
${isPastRow ? '<span class="mr-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">سابق</span>' : ""}
</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatTime(appointment.time))}</td>
<td class="whitespace-nowrap px-4 py-3">${appointmentBadge(appointment.status)}</td>
<td class="px-4 py-3 text-slate-600">${escapeHtml(appointment.reason)}</td>
<td class="whitespace-nowrap px-4 py-3">${actions}</td>
</tr>
`;
})
.join("");

renderIcons();
}

async function refreshAppointments() {
allAppointments = await getAppointmentsWithPatients();
fillSummary();
renderAppointments();
}

// سجل الإجراءات: كل إضافة أو تعديل أو حذف بينكتب بسجل مشترك، فبيوصل إشعاره لجرس التنبيهات عند الفريق كله ومعه اسم صاحبه وسببه

function getPatientName(patientId) {
const patient = allPatients.find((item) => String(item.id) === String(patientId));

return patient ? patient.name : "";
}

// كل عملية على المواعيد بتطلع إشعار للتلاتة ومعه اسم صاحبها وسبب الزيارة
function logAppointmentActivity(action, appointment) {
const titles = { added: "موعد جديد", updated: "تعديل موعد", deleted: "حذف موعد" };
const verbs = { added: "تمت إضافة موعد", updated: "تم تعديل موعد", deleted: "تم حذف موعد" };
const reasons = { added: `سبب الزيارة: ${appointment.reason || "غير مذكور"}`, updated: `تعديل بيانات الموعد — سبب الزيارة: ${appointment.reason || "غير مذكور"}`, deleted: "الموعد انلغى أو انأجّل مع المريض" };

addActivity({ patientId: appointment.patientId, title: titles[action], message: `${verbs[action]} للمريض ${getPatientName(appointment.patientId)} بتاريخ ${formatDate(appointment.date)}.`, reason: reasons[action], iconName: action === "deleted" ? "calendar-x" : "calendar-clock", link: "appointments.html" });
}

// لوحة التعديل: بنوصف الحقول وقيمها الحالية لـedit-panel.js، وهو بيرسم اللوحة وبيرجّعلنا القيم لما المستخدم يضغط حفظ

// حقول اللوحة نفس حقول النموذج، وأسماؤها نفس مفاتيح الأخطاء الراجعة من التحقق
function editPanelFields() {
return [
{ name: "patientId", label: "المريض", type: "select", placeholder: "اختر المريض", options: allPatients.map((patient) => ({ value: patient.id, label: patient.name })) },
{ name: "date", label: "التاريخ", type: "date" },
{ name: "time", label: "الوقت", type: "time" },
{ name: "status", label: "حالة الموعد", type: "select", options: Object.values(appointmentStatuses).map((status) => ({ value: status, label: status })) },
{ name: "reason", label: "سبب الزيارة", type: "text", placeholder: "مثال: متابعة ضغط الدم", span: 2 }
];
}

async function deleteAppointmentWithConfirm(appointment) {
const confirmed = await confirmDialog({
title: "حذف الموعد",
message: `سيتم حذف موعد ${getPatientName(appointment.patientId)} بتاريخ ${formatDate(appointment.date)} من الجدول.`,
confirmLabel: "حذف الموعد"
});

if (!confirmed) {
return false;
}

deleteAppointment(appointment.id);
logAppointmentActivity("deleted", appointment);

editingId = "";
await refreshAppointments();
refreshAlerts();
showToast("تم حذف الموعد.", "info");

return true;
}

function openAppointmentEditor(appointment) {
editingId = appointment.id;
renderAppointments();

openEditPanel({
mount: "appointmentEditPanel",
title: `تعديل موعد ${getPatientName(appointment.patientId)}`,
subtitle: "عدّل بيانات هذا الموعد فقط — لن يتم حفظ أي تغيير قبل الضغط على «حفظ التعديل».",
fields: editPanelFields(),
values: { patientId: appointment.patientId, date: appointment.date, time: normalizeTime(appointment.time), status: appointment.status, reason: appointment.reason },
deleteLabel: "حذف الموعد",
onSave: async (values) => {
// saveAppointmentEdit بترمي AppointmentRuleError ومعها أخطاء الحقول،
// واللوحة بتعرضها تحت الحقول لحالها
await saveAppointmentEdit(appointment.id, { ...values, doctorId: appointment.doctorId || "1" });

logAppointmentActivity("updated", { ...values, patientId: values.patientId });
showToast("تم حفظ تعديل الموعد.");

editingId = "";
await refreshAppointments();
refreshAlerts();
},
onDelete: () => deleteAppointmentWithConfirm(appointment),
// نفس حدود نموذج الإضافة بتنطبق على حقول اللوحة بعد ما تنرسم: لا يوم فات،
// ولا ساعة مضت إذا كان التاريخ هو اليوم
onReady: (panel) => limitToFutureSlots(panel.querySelector("#editField_date"), panel.querySelector("#editField_time")),
onClose: () => {
editingId = "";
renderAppointments();
}
});
}

// الأحداث: بنربط النموذج والفلاتر وأزرار الجدول مرة وحدة عند فتح الصفحة، لأن العناصر مكتوبة بالـHTML وما بتنعاد كتابتها

function bindEvents() {
bindFilterEvents();

const form = document.getElementById("appointmentForm");

// أقدم تاريخ مسموح هو اليوم، وإذا كان الموعد اليوم فأقدم وقت هو الساعة الحالية —
// بنحسبهم من هون لأنهم بيتغيروا مع مرور الوقت مش قيم ثابتة بالـHTML
syncSlotLimits = limitToFutureSlots(document.getElementById("appointmentDate"), document.getElementById("appointmentTime"));

form.addEventListener("submit", async (event) => {
event.preventDefault();

const values = readFormValues();

try {
await createAppointment(values);

logAppointmentActivity("added", values);
showToast("تمت إضافة الموعد إلى الجدول.");
resetForm();
await refreshAppointments();
refreshAlerts();
} catch (error) {
if (error instanceof AppointmentRuleError) {
showFormErrors(error.fieldErrors);
showToast(error.message, "error");
return;
}

// أي خطأ تاني (مثل رفض طبقة التخزين) بيبيّن كما هو بدل ما ينبلع
console.error(error);
showToast(error.message || "تعذر حفظ الموعد.", "error");
}
});

// بنعطي المستخدم تنبيه مبكر وهو لسا عم يعبّي، بدل ما يستنى لحد ما يضغط حفظ
["appointmentDate", "appointmentTime", "appointmentPatient"].forEach((elementId) => {
document.getElementById(elementId).addEventListener("change", async () => {
const values = readFormValues();

if (!values.date || !values.time || !values.patientId) {
return;
}

const result = await checkAppointment(values);

// بنعرض أخطاء التاريخ والوقت بس أثناء الكتابة، والسبب بينفحص وقت الإرسال
showFormErrors({ date: result.errors.date, time: result.errors.time, patientId: result.errors.patientId });
});
});

document.getElementById("appointmentsResults").addEventListener("click", (event) => {
const editButton = event.target.closest("[data-edit-id]");

if (!editButton) {
return;
}

const appointment = allAppointments.find((item) => item.id === editButton.dataset.editId);

if (appointment && appointment.isSaved) {
openAppointmentEditor(appointment);
}
});

document.getElementById("retryAppointments").addEventListener("click", loadAppointments);
}

function bindFilterEvents() {
document.getElementById("appointmentSearch").addEventListener("input", (event) => {
filters.query = event.target.value;
renderAppointments();
});

document.getElementById("appointmentStatusFilter").addEventListener("change", (event) => {
filters.status = event.target.value;
renderAppointments();
});

document.getElementById("appointmentDateFilter").addEventListener("change", (event) => {
filters.date = event.target.value;
renderAppointments();
});

document.getElementById("showTodayOnly").addEventListener("click", () => {
filters.date = todayIso();
document.getElementById("appointmentDateFilter").value = filters.date;
renderAppointments();
});

document.getElementById("clearFilters").addEventListener("click", () => {
filters.query = "";
filters.status = "All";
filters.date = "";
document.getElementById("appointmentSearch").value = "";
document.getElementById("appointmentStatusFilter").value = "All";
document.getElementById("appointmentDateFilter").value = "";
renderAppointments();
});
}

// التشغيل: بنجيب البيانات وبنعبّي الصفحة، وبنضل نسمع لأي تغيير من زميل بتبويب تاني حتى يتحدّث الجدول لحاله

async function loadAppointments() {
const loading = document.getElementById("appointmentsLoading");
const errorBox = document.getElementById("appointmentsError");
const body = document.getElementById("appointmentsBody");

try {
allPatients = await getPatients();
allAppointments = await getAppointmentsWithPatients();

fillPatientOptions();
fillSummary();
renderAppointments();

loading.classList.add("hidden");
errorBox.classList.add("hidden");
body.classList.remove("hidden");

applyUrlFilter();
renderAppointments();
} catch (error) {
console.error(error);
loading.classList.add("hidden");
body.classList.add("hidden");
errorBox.classList.remove("hidden");
} finally {
renderIcons();
}
}

async function start() {
const context = await initPage("appointments", [roles.doctor, roles.nurse, roles.receptionist]);

if (!context) {
return;
}

bindEvents();
await loadAppointments();

// أي تغيير من أي دور بيوصل لهون، فالأرقام والجداول بتتحدث بلا ما نعمل تحديث للصفحة
onDataChange(async () => {
allPatients = await getPatients();
fillPatientOptions();
await refreshAppointments();
});

// الخروج من الصفحة وقت التعديل ما بيترك لوحة معلّقة
window.addEventListener("beforeunload", closeEditPanel);
}

start();
