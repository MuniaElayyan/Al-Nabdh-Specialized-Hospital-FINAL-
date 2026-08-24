// صفحة المرضى: الجدول والبطاقات وأدوات البحث مكتوبة كلها داخل patients.html،
// وهذا الملف بيجيب البيانات وبيعبّي الصفوف والبطاقات وبيربط الأزرار.
// عمود الإجراءات فيه زر تعديل واحد، وبيفتح لوحة فوق الجدول فيها بيانات هذا المريض بس.

import { initPage, refreshAlerts } from "./layout.js";
import { getPatients, getAppointmentsWithPatients, findPatientAppointment } from "./api.js";
import { getPreferences, savePreference, updatePatient, saveStatusOverride, addActivity, onDataChange } from "./storage.js";
import { openEditPanel, closeEditPanel } from "./edit-panel.js";
import { collectPatientRecord, openDetailsPanel, closeDetailsPanel, detailsRowButton } from "./patient-report.js";
import { conditionBadge, editRowButton, showToast, renderIcons, icon } from "./ui.js";
import {
escapeHtml,
formatDate,
formatTime,
formatTextValue,
validatePatientDetails,
bloodTypeOptions,
genderOptions,
patientLimits,
conditions,
roles
} from "./helpers.js";

let allPatients = [];
let allAppointments = [];
let isNurse = false;
let isDoctor = false;
let showClinical = true;
let editingId = "";
let detailsId = "";

const filters = { query: "", condition: "All" };

// البحث: بنفلتر المرضى حسب كلمة البحث وحالة المريض، والاستقبال ما بيفلتر بالحالة لأنها مش من صلاحيته

function getVisiblePatients() {
const query = filters.query.trim().toLowerCase();

return allPatients.filter((patient) => {
const searchText = showClinical
? `${patient.name} ${patient.phone} ${patient.diagnosis}`.toLowerCase()
: `${patient.name} ${patient.phone}`.toLowerCase();

const matchesQuery = query === "" || searchText.includes(query);
// تصفية الحالة ما بتنعرض للاستقبال أصلًا، فبتضل مفتوحة عنده
const matchesCondition = !showClinical || filters.condition === "All" || patient.condition === filters.condition;

return matchesQuery && matchesCondition;
});
}

// إذا ما في موعد قادم بنعرض آخر موعد سابق موسوم، بدل ما نقول «لا يوجد» والمريض إله موعد بالسجل
function appointmentText(patientId) {
const { appointment, isUpcoming } = findPatientAppointment(allAppointments, patientId);

if (!appointment) {
return "لا يوجد موعد";
}

const text = `${formatDate(appointment.date)} — ${formatTime(appointment.time)}`;

return isUpcoming ? text : `سابق: ${text}`;
}

// العرض: بنبني صفوف الجدول وبطاقات الهاتف من نفس المرضى الظاهرين بعد التصفية

// تسجيل القراءة أهم إجراء بالجولة التمريضية، فبيضل ظاهر ببطاقة الهاتف
function recordVitalButton(patientId) {
if (!isNurse) {
return "";
}

return `
<a href="vitals.html?patient=${encodeURIComponent(patientId)}" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-200">
${icon("activity", "h-4 w-4")}
تسجيل قراءة
</a>
`;
}

function renderRows(patients) {
return patients
.map((patient) => {
const clinicalCells = showClinical
? `
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatTextValue(patient.bloodType))}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatTextValue(patient.diagnosis))}</td>
<td class="whitespace-nowrap px-4 py-3">${conditionBadge(patient.condition)}</td>
`
: "";

return `
<tr class="${patient.id === editingId || patient.id === detailsId ? "bg-teal-50" : ""}">
<td class="whitespace-nowrap px-4 py-3">
<a href="patient-details.html?id=${encodeURIComponent(patient.id)}" class="font-semibold text-slate-900 transition duration-300 hover:text-teal-700">${escapeHtml(patient.name)}</a>
</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(patient.age)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(patient.gender)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(patient.phone)}</td>
${clinicalCells}
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(appointmentText(patient.id))}</td>
<td class="whitespace-nowrap px-4 py-3">${detailsRowButton(patient.id)}</td>
<td class="whitespace-nowrap px-4 py-3">${editRowButton(patient.id)}</td>
</tr>`;
})
.join("");
}

function renderCards(patients) {
return patients
.map(
(patient) => `
<article class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg rounded-2xl border ${patient.id === editingId || patient.id === detailsId ? "border-teal-400" : "border-slate-200"} bg-surface p-4 shadow-sm">
<div class="flex items-start justify-between gap-3">
<div class="min-w-0">
<h3 class="truncate text-base font-bold text-slate-900">${escapeHtml(patient.name)}</h3>
<p class="mt-1 text-sm text-slate-500">${escapeHtml(patient.age)} سنة — ${escapeHtml(patient.gender)}</p>
<p class="mt-1 text-sm text-slate-500">${escapeHtml(patient.phone)}</p>
</div>
${showClinical ? conditionBadge(patient.condition) : ""}
</div>

<dl class="mt-3 grid ${showClinical ? "grid-cols-2" : "grid-cols-1"} gap-2 text-xs">
${
showClinical
? `<div class="rounded-xl bg-slate-50 p-2">
<dt class="font-semibold text-slate-500">التشخيص</dt>
<dd class="mt-1 font-semibold text-slate-800">${escapeHtml(formatTextValue(patient.diagnosis))}</dd>
</div>`
: ""
}
<div class="rounded-xl bg-slate-50 p-2">
<dt class="font-semibold text-slate-500">الموعد</dt>
<dd class="mt-1 font-semibold text-slate-800">${escapeHtml(appointmentText(patient.id))}</dd>
</div>
</dl>

<div class="mt-3 flex flex-wrap items-center gap-2">
${detailsRowButton(patient.id)}
${recordVitalButton(patient.id)}
${editRowButton(patient.id)}
</div>
</article>`
)
.join("");
}

// بنكتب الصفوف والبطاقات، وبنبدّل بين الجدول وصندوق «لا توجد نتائج» المكتوبين بالصفحة
function renderResults() {
const patients = getVisiblePatients();
const data = document.getElementById("patientsData");
const empty = document.getElementById("patientsEmpty");
const hasResults = patients.length > 0;

document.querySelector("[data-results-count]").textContent = `عدد النتائج: ${patients.length} من ${allPatients.length}`;

data.classList.toggle("hidden", !hasResults);
empty.classList.toggle("hidden", hasResults);

document.querySelector("[data-patient-rows]").innerHTML = hasResults ? renderRows(patients) : "";
document.getElementById("patientsCards").innerHTML = hasResults ? renderCards(patients) : "";

renderIcons();
}

// لوحة تعديل المريض: بنوصف الحقول حسب الدور وبنسلّمها لـedit-panel.js، وما بينحفظ ولا حرف قبل ما المستخدم يضغط حفظ

// الحقول بتتغير حسب الدور: الاستقبال بيانات التسجيل بس، والطاقم الطبي بيزيد التشخيص
// وفصيلة الدم، واعتماد الحالة بيضل من صلاحية الطبيب زي ما هو بملف المريض.
function editPanelFields() {
const registrationFields = [
{ name: "name", label: "اسم المريض", type: "text", placeholder: "الاسم الكامل", span: 2 },
{ name: "phone", label: "رقم الهاتف", type: "tel", inputMode: "tel", placeholder: "0599000000" },
{ name: "gender", label: "الجنس", type: "select", placeholder: "اختر", options: genderOptions.map((gender) => ({ value: gender, label: gender })) },
{ name: "age", label: "العمر", type: "number", inputMode: "numeric", min: patientLimits.ageMin, max: patientLimits.ageMax }
];

if (!showClinical) {
return registrationFields;
}

const clinicalFields = [
{ name: "diagnosis", label: "التشخيص", type: "text", placeholder: "مثال: ارتفاع ضغط الدم", span: 2 },
{ name: "bloodType", label: "فصيلة الدم", type: "select", placeholder: "غير محددة", options: bloodTypeOptions.map((type) => ({ value: type, label: type })) }
];

if (isDoctor) {
clinicalFields.push({
name: "condition",
label: "حالة المريض",
type: "select",
options: [conditions.pending, conditions.stable, conditions.followUp, conditions.critical].map((condition) => ({ value: condition, label: condition })),
hint: "اعتماد الحالة من صلاحية الطبيب المعالج"
});
}

return [...registrationFields, ...clinicalFields];
}

// بنكتب التغييرات اللي تبدّلت بس، عشان الإشعار يوضّح شو انعدّل بالضبط
function describeChanges(patient, values) {
const labels = { name: "الاسم", phone: "الهاتف", gender: "الجنس", age: "العمر", diagnosis: "التشخيص", bloodType: "فصيلة الدم", condition: "الحالة" };

return Object.keys(values)
.filter((field) => String(values[field] ?? "") !== String(patient[field] ?? ""))
.map((field) => `${labels[field]}: ${values[field] || "غير محدد"}`)
.join(" — ");
}

// لوحة التفاصيل: بتعرض كل المخزّن عن المريض، ولموظف الاستقبال بيانات التسجيل بس.
// وفيها زر تعديل بينقل مباشرة للوحة التعديل، وزر تنزيل الكشف.
async function openPatientDetails(patientId) {
const record = await collectPatientRecord(patientId);

if (!record) {
showToast("تعذر العثور على ملف المريض.", "error");
return;
}

detailsId = patientId;
renderResults();

openDetailsPanel({
mount: "patientPanel",
record,
showClinical,
onEdit: () => openPatientEditor(record.patient),
onClose: () => {
detailsId = "";
renderResults();
}
});
}

function openPatientEditor(patient) {
const fields = editPanelFields();
const currentValues = {};

fields.forEach((field) => {
currentValues[field.name] = patient[field.name] ?? "";
});

editingId = patient.id;
renderResults();

closeDetailsPanel();
detailsId = "";

openEditPanel({
mount: "patientPanel",
title: `تعديل بيانات ${patient.name}`,
subtitle: "الحقول معبّأة ببيانات هذا المريض — الإلغاء يغلق اللوحة بلا أي تغيير على السجل.",
fields,
values: currentValues,
onSave: async (values) => {
const result = validatePatientDetails({ ...currentValues, ...values }, { existingPatients: allPatients, ignorePatientId: patient.id });

if (!result.isValid) {
return result;
}

const changesSummary = describeChanges(patient, values);

// ما في شي انتغيّر؟ بنسكّر اللوحة بلا ما نكتب سجل تعديل فاضي
if (!changesSummary) {
showToast("لم يتم تغيير أي بيانات.", "info");
return;
}

// الحالة بتنحفظ بمسارها الخاص (statusOverrides) زي ما هو معمول بملف المريض،
// وباقي الحقول بتنحفظ كتعديلات على بيانات المريض
const { condition, ...profileChanges } = values;

profileChanges.age = Number(profileChanges.age);
updatePatient(patient.id, profileChanges);

if (condition && condition !== patient.condition) {
saveStatusOverride(patient.id, condition);
}

addActivity({
patientId: patient.id,
title: "تعديل بيانات مريض",
message: `تم تعديل ملف ${values.name || patient.name}.`,
reason: changesSummary,
iconName: "user-round-cog",
link: `patient-details.html?id=${encodeURIComponent(patient.id)}`
});

showToast("تم حفظ بيانات المريض.");

editingId = "";
await loadPatients();
refreshAlerts();
},
onClose: () => {
editingId = "";
renderResults();
}
});
}

// الأحداث: بنربط البحث والتصفية مرة وحدة، ومستمع واحد على منطقة النتائج بيخدم أزرار الجدول والبطاقات سوا

function bindControls() {
const searchInput = document.querySelector("[data-patient-search]");
const conditionFilter = document.getElementById("conditionFilter");

searchInput.addEventListener("input", (event) => {
filters.query = event.target.value;
renderResults();
});

// مستمع واحد على منطقة النتائج بيخدم أزرار الجدول والبطاقات سوا
document.getElementById("patientsResults").addEventListener("click", (event) => {
const detailsButton = event.target.closest("[data-details-id]");

if (detailsButton) {
openPatientDetails(detailsButton.dataset.detailsId);
return;
}

const editButton = event.target.closest("[data-edit-id]");

if (!editButton) {
return;
}

const patient = allPatients.find((item) => String(item.id) === editButton.dataset.editId);

if (patient) {
openPatientEditor(patient);
}
});

document.getElementById("retryPatients").addEventListener("click", loadPatients);

// تصفية الحالة مكتوبة للطبيب والتمريض بس، فبتكون مشيلة عند الاستقبال
if (!conditionFilter) {
return;
}

const savedCondition = getPreferences().patientsCondition;

if (savedCondition) {
filters.condition = savedCondition;
conditionFilter.value = savedCondition;
}

conditionFilter.addEventListener("change", (event) => {
filters.condition = event.target.value;
savePreference("patientsCondition", filters.condition);
renderResults();
});
}

// التشغيل: بنجيب المرضى والمواعيد وبنعرضهم، وبنتحدّث لحالنا مع أي تغيير من زميل

async function loadPatients() {
const loading = document.getElementById("patientsLoading");
const errorBox = document.getElementById("patientsError");

try {
allPatients = await getPatients();
allAppointments = await getAppointmentsWithPatients();

loading.classList.add("hidden");
errorBox.classList.add("hidden");
renderResults();
} catch (error) {
console.error(error);
loading.classList.add("hidden");
document.getElementById("patientsData").classList.add("hidden");
document.getElementById("patientsEmpty").classList.add("hidden");
errorBox.classList.remove("hidden");
} finally {
renderIcons();
}
}

async function start() {
const context = await initPage("patients", [roles.doctor, roles.nurse, roles.receptionist]);

if (!context) {
return;
}

isNurse = context.isNurse;
isDoctor = context.isDoctor;
showClinical = !context.isReceptionist;

bindControls();
await loadPatients();

// أي تغيير من أي دور بيوصل لهون، فالجدول بيتحدث بلا ما نعمل تحديث للصفحة
onDataChange(() => loadPatients());

window.addEventListener("beforeunload", () => {
closeEditPanel();
closeDetailsPanel();
});
}

start();
