// ملف المريض: كل بطاقات الصفحة وجداولها ونماذجها مكتوبة داخل patient-details.html،
// وهذا الملف بيجيب بيانات المريض من الرابط وبيعبّيها، وبيربط اعتماد الحالة والملاحظات.

import { initPage, refreshAlerts } from "./layout.js";
import { collectPatientRecord, downloadPatientReport } from "./patient-report.js";
import { getPatients, getAppointmentsWithPatients, getVitalRecords, findPatientAppointment } from "./api.js";
import {
getPatientNotes,
saveNote,
updateNote,
deleteNote,
addActivity,
saveStatusOverride,
onDataChange
} from "./storage.js";
import {
emptyState,
conditionBadge,
appointmentBadge,
readingBadge,
notePriorityBadge,
confirmDialog,
showToast,
renderIcons,
icon
} from "./ui.js";
import {
escapeHtml,
formatDate,
formatTime,
formatDateTime,
formatVitalValue,
formatTextValue,
hasCompleteClinicalProfile,
conditions,
getReadingStatus,
getInitials,
isUpcomingAppointment,
appointmentStatuses,
translateNotePriority,
roles
} from "./helpers.js";

let currentPatient = null;
let currentUserName = "";
let currentRole = "";
let showClinical = true;
let editingNoteId = "";

// رقم المريض جاي من الرابط: patient-details.html?id=3
function getPatientIdFromUrl() {
return new URLSearchParams(window.location.search).get("id") || "";
}

function setField(name, value) {
const element = document.querySelector(`[data-field="${name}"]`);

if (element) {
element.textContent = value;
}
}

// البطاقة التعريفية: بنعبّي اسم المريض وعمره وبياناته والشارات السريرية، والمعروض بيتغير حسب الدور

function fillProfile(patient, patientAppointment) {
const { appointment, isUpcoming } = patientAppointment;

document.getElementById("patientInitials").textContent = getInitials(patient.name);
document.getElementById("patientName").textContent = patient.name;

// فصيلة الدم بيانات سريرية، فما بتطلع بسطر الاستقبال
document.getElementById("patientSubtitle").textContent = showClinical
? `${patient.age} سنة — ${patient.gender} — فصيلة الدم ${formatTextValue(patient.bloodType)}`
: `${patient.age} سنة — ${patient.gender}`;

setField("id", patient.id);
setField("phone", patient.phone);
setField("diagnosis", formatTextValue(patient.diagnosis));
setField("gender", patient.gender);

// عنوان البطاقة بيتبع الواقع: موعد قادم، وإلا آخر موعد سابق، وإلا لا يوجد
document.getElementById("appointmentCardLabel").textContent = !appointment || isUpcoming ? "الموعد القادم" : "آخر موعد (سابق)";
setField("appointment", appointment ? `${formatDate(appointment.date)} — ${formatTime(appointment.time)}` : "لا يوجد موعد");

if (!showClinical) {
return;
}

document.querySelector("[data-condition-badge]").innerHTML = conditionBadge(patient.condition);
document.querySelector("[data-reading-badge]").innerHTML = readingBadge(getReadingStatus(patient));

// التنبيه بيبيّن للطاقم الطبي لما يكون الملف بلا تشخيص أو بلا فصيلة دم
document.getElementById("incompleteProfile").classList.toggle("hidden", hasCompleteClinicalProfile(patient));

const statusSelect = document.getElementById("statusSelect");

if (statusSelect) {
statusSelect.value = patient.condition;
}

const recordVitalLink = document.getElementById("recordVitalLink");

if (recordVitalLink) {
recordVitalLink.href = `vitals.html?patient=${encodeURIComponent(patient.id)}`;
}
}

// المؤشرات والجداول: بنكتب آخر قراءة معتمدة، وبنبني صفوف سجل القراءات ومواعيد المريض

function fillCurrentVitals(patient) {
document.querySelector('[data-vital="heartRate"]').textContent = formatVitalValue(patient.heartRate);
document.querySelector('[data-vital="bloodPressure"]').textContent = formatVitalValue(patient.bloodPressure);
document.querySelector('[data-vital="oxygenLevel"]').textContent = formatVitalValue(patient.oxygenLevel, "%");
}

function fillVitalsHistory(records) {
const table = document.getElementById("vitalsHistoryTable");
const empty = document.getElementById("vitalsHistoryEmpty");
const hasRecords = records.length > 0;

table.classList.toggle("hidden", !hasRecords);
empty.classList.toggle("hidden", hasRecords);

document.getElementById("vitalsHistoryRows").innerHTML = records
.map(
(record) => `
<tr class="transition duration-300 hover:bg-slate-50">
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.heartRate)} نبضة/دقيقة</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.bloodPressure)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.oxygenLevel)}%</td>
<td class="whitespace-nowrap px-4 py-3">${readingBadge(getReadingStatus(record))}</td>
<td class="whitespace-nowrap px-4 py-3 text-xs text-slate-500">${escapeHtml(formatDateTime(record.recordedAt))}</td>
</tr>
`
)
.join("");
}

function fillAppointments(appointments) {
const table = document.querySelector("[data-appointment-table]");
const empty = document.querySelector("[data-appointment-empty]");
const hasAppointments = appointments.length > 0;

table.classList.toggle("hidden", !hasAppointments);
empty.classList.toggle("hidden", hasAppointments);

document.querySelector("[data-appointment-rows]").innerHTML = appointments
.map((appointment) => {
// نفس وسم صفحة المواعيد، عشان الجدول يوضّح الموعد المنتهي بدل ما يناقض البطاقة فوق
const isPastRow = !isUpcomingAppointment(appointment) && appointment.status !== appointmentStatuses.completed;

return `
<tr class="transition duration-300 hover:bg-slate-50">
<td class="whitespace-nowrap px-4 py-3 text-slate-600">
${escapeHtml(formatDate(appointment.date))}
${isPastRow ? '<span class="mr-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">سابق</span>' : ""}
</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatTime(appointment.time))}</td>
<td class="whitespace-nowrap px-4 py-3">${appointmentBadge(appointment.status)}</td>
<td class="px-4 py-3 text-slate-600">${escapeHtml(appointment.reason)}</td>
</tr>`;
})
.join("");
}

// الملاحظات: إضافة وتعديل وحذف ملاحظات على ملف المريض، وبتنحفظ بمتصفح الجهاز الحالي

function noteField() {
return document.querySelector("[data-note-text]");
}

function setNoteError(message) {
const element = document.querySelector("[data-note-error]");

element.textContent = message;
element.classList.toggle("hidden", !message);
}

// بنعبّي النموذج بالملاحظة القديمة وبنحوّل الزر لوضع الحفظ
function fillNoteFormForEdit(note) {
editingNoteId = note.id;

noteField().value = note.text;
document.getElementById("patientNotePriority").value = note.priority;
document.getElementById("patientNoteSubmitLabel").textContent = "حفظ التعديل";
document.getElementById("cancelNoteEdit").classList.remove("hidden");

noteField().focus();
}

function resetNoteForm() {
editingNoteId = "";

document.getElementById("patientNoteForm").reset();
document.getElementById("patientNoteSubmitLabel").textContent = "إضافة الملاحظة";
document.getElementById("cancelNoteEdit").classList.add("hidden");
setNoteError("");
}

function renderNotesList() {
const notes = getPatientNotes(currentPatient.id);

if (!notes.length) {
return emptyState("لا توجد ملاحظات", "لم تُسجَّل ملاحظات على هذا الملف بعد.");
}

return `
<ul class="space-y-3">
${notes
.map(
(note) => `
<li class="rounded-xl border p-4 transition duration-300 ${
note.id === editingNoteId ? "border-teal-300 bg-teal-50/40" : "border-slate-200"
}">
<div class="flex items-start justify-between gap-3">
<p class="text-sm leading-7 text-slate-700">${escapeHtml(note.text)}</p>
${notePriorityBadge(note.priority)}
</div>
<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
<p class="text-[11px] text-slate-400">
${escapeHtml(note.author || "")} — ${escapeHtml(formatDateTime(note.createdAt))}
${note.updatedAt ? ` — عُدّلت ${escapeHtml(formatDateTime(note.updatedAt))}` : ""}
</p>
<div class="flex items-center gap-2">
<button type="button" data-edit-note="${escapeHtml(note.id)}" aria-label="تعديل الملاحظة" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-200">
${icon("pencil", "h-3.5 w-3.5")}
تعديل
</button>
<button type="button" data-delete-note="${escapeHtml(note.id)}" aria-label="حذف الملاحظة" class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition duration-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200">
${icon("trash-2", "h-3.5 w-3.5")}
حذف
</button>
</div>
</div>
</li>`
)
.join("")}
</ul>
`;
}

function refreshNotesList() {
document.getElementById("patientNotesList").innerHTML = renderNotesList();
renderIcons();
}

function bindNoteEvents() {
const form = document.getElementById("patientNoteForm");
const notesList = document.getElementById("patientNotesList");

form.addEventListener("submit", (event) => {
event.preventDefault();

const text = noteField().value.trim();
const priority = document.getElementById("patientNotePriority").value;

setNoteError(text.length >= 5 ? "" : "يرجى كتابة ملاحظة لا تقل عن خمسة أحرف.");

if (text.length < 5) {
return;
}

if (editingNoteId) {
updateNote(editingNoteId, { priority, text });

// الإشعار بيوصل للتلاتة ومعه اسم اللي عدّل والسبب
addActivity({ patientId: currentPatient.id, title: "تعديل ملاحظة", message: `تم تعديل ملاحظة على ملف ${currentPatient.name}.`, reason: `تحديث نص الملاحظة ونوعها صار «${translateNotePriority(priority)}»`, iconName: "pencil", link: `patient-details.html?id=${encodeURIComponent(currentPatient.id)}` });

showToast("تم حفظ تعديل الملاحظة.");
} else {
saveNote({ patientId: currentPatient.id, patientName: currentPatient.name, priority, text, author: currentUserName });

// الإشعار بيوصل للتلاتة ومعه اسم اللي كتب والسبب
addActivity({ patientId: currentPatient.id, title: "ملاحظة جديدة", message: `تم تسجيل ملاحظة على ملف ${currentPatient.name}.`, reason: `ملاحظة ${translateNotePriority(priority)} على الملف: ${text}`, iconName: "notebook-pen", link: `patient-details.html?id=${encodeURIComponent(currentPatient.id)}` });

showToast("تمت إضافة الملاحظة إلى الملف.");
}

resetNoteForm();
refreshNotesList();
refreshAlerts();
});

document.getElementById("cancelNoteEdit").addEventListener("click", () => {
resetNoteForm();
refreshNotesList();
});

// مستمع واحد على القائمة بيتصرّف مع كل أزرار التعديل والحذف
notesList.addEventListener("click", async (event) => {
const editButton = event.target.closest("[data-edit-note]");
const deleteButton = event.target.closest("[data-delete-note]");

if (editButton) {
const note = getPatientNotes(currentPatient.id).find((item) => item.id === editButton.dataset.editNote);

if (note) {
fillNoteFormForEdit(note);
refreshNotesList();
}

return;
}

if (!deleteButton) {
return;
}

const confirmed = await confirmDialog({ title: "حذف الملاحظة", message: "سيتم حذف هذه الملاحظة من ملف المريض ولا يمكن التراجع عن العملية.", confirmLabel: "حذف" });

if (!confirmed) {
return;
}

const deletedId = deleteButton.dataset.deleteNote;

deleteNote(deletedId);

// لو كنا عم نعدّل نفس الملاحظة المحذوفة، بنرجّع النموذج لوضعه الطبيعي
if (editingNoteId === deletedId) {
resetNoteForm();
}

// الإشعار بيوصل للتلاتة ومعه اسم اللي حذف والسبب
addActivity({ patientId: currentPatient.id, title: "حذف ملاحظة", message: `تم حذف ملاحظة من ملف ${currentPatient.name}.`, reason: "الملاحظة ما عاد إلها لزوم بالملف", iconName: "trash-2", link: `patient-details.html?id=${encodeURIComponent(currentPatient.id)}` });

refreshNotesList();
showToast("تم حذف الملاحظة.", "info");
refreshAlerts();
});
}

function bindStatusForm() {
const form = document.getElementById("statusForm");

// الممرضة والاستقبال ما إلهم نموذج أصلًا، فما في شي نربطه
if (!form) {
return;
}

form.addEventListener("submit", async (event) => {
event.preventDefault();

const nextCondition = document.getElementById("statusSelect").value;

if (nextCondition === currentPatient.condition) {
showToast("الحالة المختارة هي نفس الحالة الحالية.", "info");
return;
}

const confirmed = await confirmDialog({ title: "اعتماد حالة جديدة", message: `سيتم تحديث حالة ${currentPatient.name} من «${currentPatient.condition}» إلى «${nextCondition}».`, confirmLabel: "اعتماد الحالة", tone: "teal" });

if (!confirmed) {
return;
}

saveStatusOverride(currentPatient.id, nextCondition);

// الإشعار بيوصل للتلاتة ومعه اسم اللي اعتمد الحالة والسبب
addActivity({ patientId: currentPatient.id, title: "تحديث حالة مريض", message: `أصبحت حالة ${currentPatient.name} «${nextCondition}».`, reason: `اعتماد حالة جديدة بدل «${currentPatient.condition}»`, iconName: nextCondition === conditions.critical ? "triangle-alert" : "check-circle-2", link: `patient-details.html?id=${encodeURIComponent(currentPatient.id)}` });

showToast("تم اعتماد الحالة الجديدة للمريض.");
await loadPatientFile();
refreshAlerts();
});
}

// تنزيل الكشف: بنجمع كل المخزّن عن المريض وقت الضغط — مش وقت رسم الصفحة — حتى يطلع الكشف بآخر البيانات

function bindDownloadButton() {
document.getElementById("downloadReport").addEventListener("click", async () => {
const button = document.getElementById("downloadReport");

button.disabled = true;

try {
const record = await collectPatientRecord(currentPatient.id);

if (!record) {
showToast("تعذر تجهيز الكشف.", "error");
return;
}

downloadPatientReport(record, showClinical);
showToast("تم تنزيل كشف المريض.");
} catch (error) {
console.error(error);
showToast("تعذر تنزيل الكشف.", "error");
} finally {
button.disabled = false;
}
});
}

// عرض الشاشات: الصفحة فيها أربع شاشات (انتظار، خطأ، ملف غير متاح، وملف المريض) وبنبيّن وحدة بس بكل لحظة

function showOnly(sectionId) {
["patientLoading", "patientError", "patientNotFound", "patientBody"].forEach((id) => {
document.getElementById(id).classList.toggle("hidden", id !== sectionId);
});
}

// الملف غير متاح: إما ما انحدد مريض بالرابط، وإما الرقم مش موجود بالسجلات
function showNotFound(reason) {
document.querySelector('[data-missing="none"]').classList.toggle("hidden", reason !== "none");
document.querySelector('[data-missing="unknown"]').classList.toggle("hidden", reason !== "unknown");
showOnly("patientNotFound");
renderIcons();
}

// التشغيل: بناخد رقم المريض من الرابط، بنجيب ملفه ومواعيده وقراءاته، وبنعبّي فيهن الصفحة

async function loadPatientFile() {
const patientId = getPatientIdFromUrl();

if (!patientId) {
showNotFound("none");
return;
}

try {
const patients = await getPatients();
const patient = patients.find((item) => item.id === patientId);

if (!patient) {
showNotFound("unknown");
return;
}

currentPatient = patient;

const appointments = await getAppointmentsWithPatients();
// ما منجيب سجل القراءات للاستقبال، لأنه ما رح ينعرض له أصلًا
const vitals = showClinical ? await getVitalRecords() : [];

const patientAppointments = appointments.filter((appointment) => appointment.patientId === patient.id);

fillProfile(patient, findPatientAppointment(appointments, patient.id));
fillAppointments(patientAppointments);

if (showClinical) {
fillCurrentVitals(patient);
fillVitalsHistory(vitals.filter((record) => record.patientId === patient.id));
refreshNotesList();
} else {
// عند الاستقبال قسم المواعيد بيبيّن إذا كان للمريض مواعيد فعلًا
document.getElementById("receptionAppointments").classList.toggle("hidden", !patientAppointments.length);
}

showOnly("patientBody");
} catch (error) {
console.error(error);
showOnly("patientError");
} finally {
renderIcons();
}
}

async function start() {
const context = await initPage("patient-details", [roles.doctor, roles.nurse, roles.receptionist]);

if (!context) {
return;
}

currentUserName = context.user ? context.user.name : "";
currentRole = context.role;
showClinical = !context.isReceptionist;

bindDownloadButton();
bindStatusForm();
document.getElementById("retryPatientFile").addEventListener("click", loadPatientFile);

if (showClinical) {
bindNoteEvents();
}

await loadPatientFile();

// أي تغيير من أي دور بيوصل لهون، فالأرقام والجداول بتتحدث بلا ما نعمل تحديث للصفحة
onDataChange(() => {
// ما منعيد الرسم والمستخدم بنص كتابة ملاحظة، حتى ما يضيع كلامه
const field = noteField();

if (!field || !field.value.trim()) {
loadPatientFile();
}
});
}

start();
