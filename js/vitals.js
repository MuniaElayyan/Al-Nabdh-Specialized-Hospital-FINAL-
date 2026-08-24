// السجلات الحيوية: النموذج والجدول وأدوات التصفية مكتوبين داخل vitals.html،
// وهذا الملف بيعبّي قائمة المرضى وصفوف القراءات وبيتحقق من المُدخلات.
//
// ضغط الدم حقل نصي واحد بصيغة "120/80" — نفس صيغة التخزين بملفات البيانات.
// التلميح للمستخدم بالـplaceholder، والتحقق بيفصل الانقباضي عن الانبساطي
// وبيفحص كل واحد بحدوده لحاله (شوف getBloodPressureError في helpers.js).

import { initPage, refreshAlerts } from "./layout.js";
import { getPatients, getVitalRecords } from "./api.js";
import { saveVital, updateVital, deleteVital, addActivity, onDataChange } from "./storage.js";
import { openEditPanel, closeEditPanel } from "./edit-panel.js";
import {
conditionBadge,
readingBadge,
editRowButton,
lockedRowNote,
confirmDialog,
showToast,
setFieldError,
setFieldInvalid,
renderIcons
} from "./ui.js";
import {
escapeHtml,
formatDateTime,
getReadingStatus,
readingStatuses,
validateVitalRecord,
bloodPressurePlaceholder,
heartRateLimits,
oxygenLimits,
roles
} from "./helpers.js";

let allPatients = [];
let allRecords = [];
let editingId = "";
let currentUserName = "";
let isNurse = false;

const filters = { query: "", status: "All" };

// أسماء الحقول نفس مفاتيح الأخطاء الراجعة من validateVitalRecord
const formFieldIds = {
patientId: "vitalPatient",
heartRate: "vitalHeartRate",
bloodPressure: "vitalBloodPressure",
oxygenLevel: "vitalOxygen"
};

// الصلاحيات: مين بيقدر يعدّل ومين بيقدر يحذف — الممرضة بتعدّل اللي سجّلته بس، والقراءة المرجعية ما حدا بيلمسها

function canEditRecord(record) {
if (!record.isSaved) {
return false;
}

return isNurse ? record.recordedBy === currentUserName : true;
}

// حذف قراءة من السجل الطبي قرار طبي، فبيضل محصور بالطبيب
function canDeleteRecord(record) {
return record.isSaved && !isNurse;
}

// القراءة المرجعية جاية من ملف المستشفى، والقراءات القديمة ممكن تكون بلا اسم مسجّل
function recordAuthor(record) {
if (!record.isSaved) {
return "سجل المستشفى";
}

return record.recordedBy || "غير محدد";
}

// النموذج: بنعبّي قائمة المرضى، بنقرأ الحقول، وبنعرض رسائل الخطأ تحت كل حقل

// قائمة المرضى بتتغير مع كل تسجيل مريض جديد، فبنبنيها من البيانات
function fillPatientOptions() {
const select = document.getElementById("vitalPatient");
const selectedId = select.value;

select.innerHTML = `<option value="">اختر المريض</option>${allPatients.map((patient) => `<option value="${escapeHtml(patient.id)}">${escapeHtml(patient.name)}</option>`).join("")}`;
select.value = selectedId;
}

// بنقرأ الحقول كما هي، والتحقق مسؤولية validateVitalRecord
function readFormValues() {
return {
patientId: document.getElementById("vitalPatient").value,
heartRate: document.getElementById("vitalHeartRate").value.trim(),
bloodPressure: document.getElementById("vitalBloodPressure").value.trim(),
oxygenLevel: document.getElementById("vitalOxygen").value.trim()
};
}

function showFormErrors(errors = {}) {
Object.entries(formFieldIds).forEach(([field, elementId]) => {
const message = errors[field] || "";

setFieldError(`${elementId}Error`, message);
setFieldInvalid(document.getElementById(elementId), Boolean(message));
});
}

function resetForm() {
document.getElementById("vitalForm").reset();
showFormErrors({});
}

// بنحوّل القيم المتحقَّق منها لشكل السجل المحفوظ: الأرقام أرقام، وضغط الدم
// بينحفظ كنص "120/80" — نفس صيغة ملفات البيانات، فما بتنكسر أي شاشة بتقراه
function toStoredRecord(values) {
return {
patientId: values.patientId,
heartRate: Number(values.heartRate),
bloodPressure: values.bloodPressure.trim(),
oxygenLevel: Number(values.oxygenLevel)
};
}

// التصفية: بنرجّع القراءات المطابقة للبحث ولحالة القراءة، وبنقدر نفتح الصفحة ومريض محدد جاهز من الرابط

// بنقدر نفتح الصفحة والمريض مختار على طول: vitals.html?patient=3
function applyPatientFromUrl() {
const requestedPatient = new URLSearchParams(window.location.search).get("patient");
const patient = allPatients.find((item) => String(item.id) === String(requestedPatient));

if (!patient) {
return;
}

document.getElementById("vitalPatient").value = patient.id;
filters.query = patient.name;
document.getElementById("vitalSearch").value = filters.query;
document.getElementById("vitalHeartRate").focus();
}

function getVisibleRecords() {
const query = filters.query.trim().toLowerCase();

return allRecords.filter((record) => {
const matchesQuery = query === "" || String(record.patientName).toLowerCase().includes(query);
const matchesStatus = filters.status === "All" || getReadingStatus(record) === filters.status;

return matchesQuery && matchesStatus;
});
}

// العرض: بنعد القراءات للبطاقات التلاتة، وبنبني صفوف الجدول من القراءات الظاهرة

function fillSummary() {
const countByStatus = (status) => allRecords.filter((record) => getReadingStatus(record) === status).length;

document.querySelector('[data-stat="normal"]').textContent = String(countByStatus(readingStatuses.normal));
document.querySelector('[data-stat="warning"]').textContent = String(countByStatus(readingStatuses.warning));
document.querySelector('[data-stat="critical"]').textContent = String(countByStatus(readingStatuses.critical));
}

// زر واحد بعمود الإجراءات، والحذف صار جوا لوحة التعديل حسب صلاحية الدور
function renderActions(record) {
if (canEditRecord(record)) {
return editRowButton(record.id);
}

return lockedRowNote(record.isSaved ? "سجّلها زميل آخر" : "قراءة مرجعية");
}

function renderRecords() {
const records = getVisibleRecords();
const table = document.getElementById("vitalsTable");
const empty = document.getElementById("vitalsEmpty");
const hasResults = records.length > 0;

document.getElementById("vitalsCount").textContent = `عدد القراءات: ${records.length} من ${allRecords.length}`;

table.classList.toggle("hidden", !hasResults);
empty.classList.toggle("hidden", hasResults);

document.getElementById("vitalsRows").innerHTML = records
.map(
(record) => `
<tr class="${record.id === editingId ? "bg-teal-50" : ""}">
<td class="whitespace-nowrap px-4 py-3">
<a href="patient-details.html?id=${encodeURIComponent(record.patientId)}" class="font-semibold text-slate-900 transition duration-300 hover:text-teal-700">${escapeHtml(record.patientName)}</a>
</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.heartRate)} نبضة/دقيقة</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.bloodPressure)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.oxygenLevel)}%</td>
<td class="whitespace-nowrap px-4 py-3">${conditionBadge(record.condition)}</td>
<td class="whitespace-nowrap px-4 py-3">${readingBadge(getReadingStatus(record))}</td>
<td class="whitespace-nowrap px-4 py-3 text-xs text-slate-500">${escapeHtml(recordAuthor(record))}</td>
<td class="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
${escapeHtml(formatDateTime(record.recordedAt))}
${record.updatedAt ? '<span class="mr-1 text-[11px] text-teal-600">(معدّلة)</span>' : ""}
</td>
<td class="whitespace-nowrap px-4 py-3">${renderActions(record)}</td>
</tr>`
)
.join("");

renderIcons();
}

// بنعيد قراءة السجل وبنحدّث الملخّص والجدول مع بعض بعد أي عملية
async function refreshRecords() {
allRecords = await getVitalRecords();
fillSummary();
renderRecords();
}

function getPatientName(patientId) {
const patient = allPatients.find((item) => String(item.id) === String(patientId));

return patient ? patient.name : "";
}

// لوحة التعديل: بنوصف حقول القراءة لـedit-panel.js، وزر الحذف اللي جواتها بيبيّن للطبيب بس

function editPanelFields() {
return [
{ name: "patientId", label: "المريض", type: "select", placeholder: "اختر المريض", options: allPatients.map((patient) => ({ value: patient.id, label: patient.name })) },
{ name: "heartRate", label: "نبض القلب (نبضة/دقيقة)", type: "number", inputMode: "numeric", min: heartRateLimits.min, max: heartRateLimits.max },
{ name: "bloodPressure", label: "ضغط الدم (انقباضي/انبساطي)", type: "text", placeholder: bloodPressurePlaceholder },
{ name: "oxygenLevel", label: "مستوى الأكسجين (%)", type: "number", inputMode: "numeric", min: oxygenLimits.min, max: oxygenLimits.max }
];
}

async function deleteRecordWithConfirm(record) {
const confirmed = await confirmDialog({
title: "حذف القراءة",
message: `سيتم حذف قراءة ${record.patientName} المسجلة بتاريخ ${formatDateTime(record.recordedAt)} من السجل.`,
confirmLabel: "حذف القراءة"
});

if (!confirmed) {
return false;
}

deleteVital(record.id);

addActivity({ patientId: record.patientId, title: "حذف قراءة حيوية", message: `تم حذف قراءة من سجل ${record.patientName}.`, reason: "القراءة كانت مكررة أو مدخلة غلط", iconName: "trash-2", link: `patient-details.html?id=${encodeURIComponent(record.patientId)}` });

editingId = "";
await refreshRecords();
refreshAlerts();
showToast("تم حذف القراءة.", "info");

return true;
}

function openVitalEditor(record) {
editingId = record.id;
renderRecords();

openEditPanel({
mount: "vitalEditPanel",
title: `تعديل قراءة ${record.patientName}`,
subtitle: "القيم معبّأة من القراءة المسجّلة — لن يتغير شيء قبل الضغط على «حفظ التعديل».",
fields: editPanelFields(),
values: { patientId: record.patientId, heartRate: record.heartRate, bloodPressure: record.bloodPressure, oxygenLevel: record.oxygenLevel },
deleteLabel: canDeleteRecord(record) ? "حذف القراءة" : "",
onSave: async (values) => {
const result = validateVitalRecord(values, { knownPatients: allPatients });

if (!result.isValid) {
return result;
}

// بنتأكد من الصلاحية مرة تانية وقت الحفظ، مش بس وقت رسم الزر
const target = allRecords.find((item) => item.id === record.id);

if (!target || !canEditRecord(target)) {
throw new Error("لا تملك صلاحية تعديل هذه القراءة.");
}

const stored = toStoredRecord(values);

updateVital(record.id, stored);

const readingStatus = getReadingStatus(stored);
const patientName = getPatientName(values.patientId);

addActivity({ patientId: values.patientId, title: "تعديل قراءة حيوية", message: `تم تعديل قراءة ${patientName} لتصبح ${readingStatus}.`, reason: `تصحيح أرقام القراءة، وصارت ${readingStatus}`, iconName: readingStatus === readingStatuses.critical ? "triangle-alert" : "pencil", link: `patient-details.html?id=${encodeURIComponent(values.patientId)}` });

showToast("تم حفظ تعديل القراءة.");

editingId = "";
await refreshRecords();
refreshAlerts();
},
onDelete: canDeleteRecord(record) ? () => deleteRecordWithConfirm(record) : null,
onClose: () => {
editingId = "";
renderRecords();
}
});
}

// الأحداث: بنربط النموذج والفلاتر وأزرار الجدول مرة وحدة عند فتح الصفحة

function bindEvents() {
const form = document.getElementById("vitalForm");

form.addEventListener("submit", async (event) => {
event.preventDefault();

const values = readFormValues();
const result = validateVitalRecord(values, { knownPatients: allPatients });

showFormErrors(result.errors);

if (!result.isValid) {
showToast("يرجى مراجعة الحقول المطلوبة.", "error");
return;
}

const stored = toStoredRecord(values);
const readingStatus = getReadingStatus(stored);
const patientName = getPatientName(values.patientId);

try {
saveVital({ ...stored, recordedBy: currentUserName });
} catch (error) {
console.error(error);
showToast(error.message || "تعذر حفظ القراءة.", "error");
return;
}

addActivity({ patientId: values.patientId, title: "قراءة حيوية جديدة", message: `تم تسجيل قراءة ${readingStatus} للمريض ${patientName}.`, reason: `قراءة جديدة بالجولة: نبض ${stored.heartRate}، ضغط ${stored.bloodPressure}، أكسجين ${stored.oxygenLevel}%`, iconName: readingStatus === readingStatuses.critical ? "triangle-alert" : "activity", link: `patient-details.html?id=${encodeURIComponent(values.patientId)}` });

showToast("تم حفظ القراءة الحيوية.");
resetForm();
await refreshRecords();
refreshAlerts();
});

// زر «مسح الحقول»: بيفضّي كل الحقول فعليًا وبيرجّع الـplaceholder
// وبيشيل رسائل الخطأ — وما بيمسّ أي بيانات محفوظة بالسجل
document.getElementById("clearVitalForm").addEventListener("click", () => {
resetForm();
document.getElementById("vitalPatient").focus();
showToast("تم مسح حقول النموذج.", "info");
});

document.getElementById("vitalsResults").addEventListener("click", (event) => {
const editButton = event.target.closest("[data-edit-id]");

if (!editButton) {
return;
}

const record = allRecords.find((item) => item.id === editButton.dataset.editId);

if (record && canEditRecord(record)) {
openVitalEditor(record);
}
});

document.getElementById("vitalSearch").addEventListener("input", (event) => {
filters.query = event.target.value;
renderRecords();
});

document.getElementById("readingStatusFilter").addEventListener("change", (event) => {
filters.status = event.target.value;
renderRecords();
});

document.getElementById("retryVitals").addEventListener("click", loadVitals);
}

// التشغيل: بنجيب المرضى والقراءات وبنعبّي الصفحة، وبنتحدّث لحالنا مع أي تغيير من زميل

async function loadVitals() {
const loading = document.getElementById("vitalsLoading");
const errorBox = document.getElementById("vitalsError");
const body = document.getElementById("vitalsBody");

try {
allPatients = await getPatients();
allRecords = await getVitalRecords();

fillPatientOptions();
fillSummary();
renderRecords();

loading.classList.add("hidden");
errorBox.classList.add("hidden");
body.classList.remove("hidden");

applyPatientFromUrl();
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
const context = await initPage("vitals", [roles.doctor, roles.nurse]);

if (!context) {
return;
}

currentUserName = context.user ? context.user.name : "";
isNurse = context.isNurse;

bindEvents();
await loadVitals();

// أي تغيير من أي دور بيوصل لهون، فالأرقام والجداول بتتحدث بلا ما نعمل تحديث للصفحة
onDataChange(async () => {
// بنحدّث الجدول والبطاقات بس، والنموذج اللي بالأعلى بيضل زي ما تركه المستخدم
allPatients = await getPatients();
fillPatientOptions();
await refreshRecords();
});

window.addEventListener("beforeunload", closeEditPanel);
}

start();
