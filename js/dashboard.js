// لوحة التحكم: كل البطاقات والاختصارات والنماذج مكتوبة داخل dashboard.html،
// وهذا الملف بيحسب الأرقام من البيانات وبيحطها بمكانها، وبيعبّي القوائم وبيربط النماذج.

import { initPage, refreshAlerts } from "./layout.js";
import { getPatients, getAppointmentsWithPatients, getVitalRecords } from "./api.js";
import { createAppointment, AppointmentRuleError } from "./appointment-rules.js";
import {
getSavedNotes,
getActivityLog,
savePatient,
updatePatient,
saveNote,
updateNote,
deleteNote,
addActivity,
savePreference,
saveStatusOverride,
onDataChange
} from "./storage.js";
import {
emptyState,
compactPatientList,
compactAppointmentList,
conditionBadge,
readingBadge,
notePriorityBadge,
confirmDialog,
showToast,
setFieldError,
renderIcons,
icon
} from "./ui.js";
import {
escapeHtml,
todayIso,
average,
getRecentlyUpdatedPatients,
validatePatientDetails,
formatDateTime,
isUpcomingAppointment,
summarizeAppointments,
getReadingStatus,
getInitials,
conditions,
appointmentStatuses,
readingStatuses,
translateNotePriority,
escalateCondition,
hasCompleteClinicalProfile
} from "./helpers.js";

let currentUserName = "";
let isReceptionist = false;
let editingNoteId = "";

// آخر نسخة من بيانات الصفحة. النماذج بتقرأ من هون بدل ما تحمل نسخة قديمة بالإغلاق،
// فالمريض الجديد بيبيّن بقوائم الاختيار على طول.
let allPatients = [];
let allAppointments = [];

// الإحصائيات: كل رقم باللوحة محسوب من البيانات نفسها، ما في ولا رقم مكتوب بالإيد

function calculateStats(patients, appointments, vitals) {
return {
patientsTotal: patients.length,
stable: patients.filter((patient) => patient.condition === conditions.stable).length,
critical: patients.filter((patient) => patient.condition === conditions.critical).length,
followUp: patients.filter((patient) => patient.condition === conditions.followUp).length,
// أرقام المواعيد كلها جاية من summarizeAppointments، هيك ما بيصير الكرت يقول رقم والجدول يقول غيره
...summarizeAppointments(appointments),
averageHeartRate: average(patients.map((patient) => Number(patient.heartRate))),
averageOxygen: average(patients.map((patient) => Number(patient.oxygenLevel))),
// أرقام تخص المتابعة التمريضية: حالة القراءات نفسها مش حالة المرضى
warningReadings: vitals.filter((record) => getReadingStatus(record) === readingStatuses.warning).length,
// حجم سجل القراءات، ومعه وقت أحدث قراءة فيه — السجل واصلنا مرتّب من الأحدث
totalReadings: vitals.length,
lastReadingAt: vitals.length ? vitals[0].recordedAt : ""
};
}

// نفس الرقم ممكن يكون مكتوب بأكثر من مكان (بطاقة واختصار)، فبنعبّي كل المواضع
function setStat(name, value) {
document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
element.textContent = String(value);
});
}

// بطاقات الأرقام: عناوينها بالـHTML لكل دور، وهون بنكتب قيمها
function fillStats(stats) {
["patientsTotal", "stable", "critical", "followUp", "today", "upcoming", "scheduled", "urgent", "completed", "warningReadings", "totalReadings", "averageHeartRate", "averageOxygen"].forEach((name) => {
setStat(name, stats[name]);
});

const readingsNote = document.querySelector('[data-stat-note="totalReadings"]');

if (readingsNote) {
readingsNote.textContent = stats.lastReadingAt ? `آخر قراءة: ${formatDateTime(stats.lastReadingAt)}` : "لا توجد قراءات بعد";
}
}

// الاختصارات السريعة: المربعات مكتوبة بالـHTML، وهون بنربط اللي منها بيعمل شغل بالصفحة — يفلتر قائمة المرضى أو ينزّل الشاشة على نموذج

function bindQuickActions() {
const criticalTile = document.querySelector('[data-quick="critical"]');
const urgentTile = document.querySelector('[data-quick="urgent"]');
const noteTile = document.querySelector('[data-quick="note"]');
const patientTile = document.querySelector('[data-quick="patient"]');

// بنفتح قائمة المرضى وهي مفلترة على الحالات الحرجة على طول
if (criticalTile) {
criticalTile.addEventListener("click", () => {
savePreference("patientsCondition", conditions.critical);
window.location.href = "patients.html";
});
}

// ومربع الاستقبال بيفتح جدول المواعيد مفلتر على العاجل
if (urgentTile) {
urgentTile.addEventListener("click", () => {
window.location.href = `appointments.html?status=${encodeURIComponent(appointmentStatuses.urgent)}`;
});
}

// مربع حالة الرعاية بينزّل على النموذج بنفس الصفحة بدل ما يفتح شاشة تانية
if (noteTile) {
noteTile.addEventListener("click", () => {
document.getElementById("careCaseForm").scrollIntoView({ behavior: "smooth", block: "center" });
document.getElementById("casePatient").focus();
});
}

if (patientTile) {
patientTile.addEventListener("click", () => {
document.getElementById("patientRegistrationForm").scrollIntoView({ behavior: "smooth", block: "center" });
document.getElementById("regPatientName").focus();
});
}
}

// تسجيل مريض جديد: نموذج الاستقبال — بيتحقق من البيانات، بيعطي المريض رقم ملف تسلسلي، وبيحجز أول زيارة إذا انحدد وقتها

// رقم الملف تسلسلي، مش عشوائي: بناخد أعلى رقم ملف موجود ونزيد عليه واحد
function getNextPatientId(patients) {
const numericIds = patients
.map((patient) => Number(patient.id))
.filter((id) => Number.isFinite(id));

const maxId = numericIds.length ? Math.max(...numericIds) : 0;

return String(maxId + 1);
}

// المرضى بينحفظوا بأرقام ملفات تسلسلية، والزيارة الأولى (لو انحددت) بتمر من
// نفس قواعد المواعيد المستعملة بصفحة المواعيد — فما في مسار تاني بيتجاوز التحقق.
function bindPatientRegistrationForm() {
const form = document.getElementById("patientRegistrationForm");

if (!form) {
return;
}

// أقدم تاريخ لأول زيارة هو اليوم — بنكتبه من هون لأنه بيتغير كل يوم
document.getElementById("regVisitDate").min = todayIso();

const registrationErrorIds = { name: "regPatientNameError", phone: "regPatientPhoneError", gender: "regPatientGenderError", age: "regPatientAgeError" };

function showRegistrationErrors(errors = {}) {
Object.entries(registrationErrorIds).forEach(([field, errorId]) => setFieldError(errorId, errors[field] || ""));
setFieldError("regVisitDateError", errors.date || "");
setFieldError("regVisitTimeError", errors.time || "");
}

form.addEventListener("submit", async (event) => {
event.preventDefault();

const values = {
name: document.getElementById("regPatientName").value.trim(),
phone: document.getElementById("regPatientPhone").value.trim(),
gender: document.getElementById("regPatientGender").value,
age: document.getElementById("regPatientAge").value.trim(),
nationalId: document.getElementById("regPatientNationalId").value.trim()
};

const visitDate = document.getElementById("regVisitDate").value;
const visitTime = document.getElementById("regVisitTime").value;
const visitReason = document.getElementById("regVisitReason").value.trim() || "كشف أولي";

// نفس دالة التحقق المستعملة بلوحة تعديل المريض، فالقواعد وحدة بالمكانين
const result = validatePatientDetails(values, { existingPatients: allPatients });

showRegistrationErrors(result.errors);

if (!result.isValid) {
showToast("يرجى مراجعة بيانات المريض.", "error");
return;
}

// المريض بيتسجّل برقم ملف تسلسلي وحالة "بانتظار التشخيص" لحد ما الطبيب أو الممرضة يكمّلوا ملفه السريري
const patient = savePatient({ id: getNextPatientId(allPatients), ...values, age: Number(values.age), condition: conditions.pending });

// تحديد وقت الزيارة اختياري. إذا انحدد، بننشئ الموعد عبر createAppointment
// اللي بترفض الوقت الماضي والوقت المتعارض وبترجّع سبب الرفض.
let visitNote = "بانتظار جدولة أول زيارة";

if (visitDate && visitTime) {
try {
await createAppointment({ patientId: patient.id, doctorId: "1", date: visitDate, time: visitTime, status: appointmentStatuses.scheduled, reason: visitReason });
visitNote = `أول زيارة بتاريخ ${visitDate} الساعة ${visitTime}`;
} catch (error) {
const message = error instanceof AppointmentRuleError ? error.message : "تعذر حجز أول زيارة.";

visitNote = `تم التسجيل بلا موعد — ${message}`;
showRegistrationErrors(error.fieldErrors || {});
showToast(`تم تسجيل المريض، لكن لم يُحجز الموعد: ${message}`, "error");
}
}

addActivity({ patientId: patient.id, title: "تسجيل مريض جديد", message: `تم تسجيل ${patient.name} في النظام.`, reason: visitNote, iconName: "user-round-plus", link: `patient-details.html?id=${encodeURIComponent(patient.id)}` });

form.reset();
showRegistrationErrors({});

if (visitNote.startsWith("أول زيارة") || visitNote === "بانتظار جدولة أول زيارة") {
showToast("تم تسجيل المريض بنجاح.");
}

await refreshDashboard();
refreshAlerts();
});
}

// حالة الرعاية: نموذج الطاقم الطبي — بيسجّل ملاحظة على مريض، بيرفع تصنيفه إذا كانت الحالة أشد، وبيكمّل ملفه السريري إذا كان ناقص

// قائمة اختيار المريض لازم تعرف المرضى الجدد، فبنعيد بناء خياراتها
// مع الحفاظ على المريض المختار حاليًا
function fillCasePatientOptions() {
const select = document.getElementById("casePatient");

if (!select) {
return;
}

const selectedId = select.value;

select.innerHTML = `<option value="">اختر المريض</option>${allPatients.map((patient) => `<option value="${escapeHtml(patient.id)}">${escapeHtml(patient.name)}</option>`).join("")}`;
select.value = selectedId;
}

// بنعرض حقلي التشخيص وفصيلة الدم بس لما المريض المختار ملفه ناقص، وبنفضّيهم لما نخفيهم
function toggleCaseCompletionFields() {
const select = document.getElementById("casePatient");
const fields = document.getElementById("caseCompletionFields");
const patient = allPatients.find((item) => item.id === select.value);
const needsCompletion = Boolean(patient) && !hasCompleteClinicalProfile(patient);

fields.classList.toggle("hidden", !needsCompletion);

if (!needsCompletion) {
document.getElementById("caseDiagnosis").value = "";
document.getElementById("caseBloodType").value = "";
setFieldError("caseDiagnosisError", "");
setFieldError("caseBloodTypeError", "");
}
}

// بنعبّي النموذج بالحالة المختارة وبنحوّله لوضع التعديل
function fillCaseFormForEdit(note) {
editingNoteId = note.id;

document.getElementById("casePatient").value = note.patientId;
document.getElementById("casePriority").value = note.priority;
document.getElementById("caseNote").value = note.text;
document.getElementById("caseSubmitLabel").textContent = "حفظ التعديل";
document.getElementById("cancelCaseEdit").classList.remove("hidden");

toggleCaseCompletionFields();
document.getElementById("caseNote").focus();
}

function resetCaseForm() {
editingNoteId = "";

document.getElementById("careCaseForm").reset();
document.getElementById("caseSubmitLabel").textContent = "إرسال";
document.getElementById("cancelCaseEdit").classList.add("hidden");
document.getElementById("caseCompletionFields").classList.add("hidden");
setFieldError("casePatientError", "");
setFieldError("caseNoteError", "");
setFieldError("caseDiagnosisError", "");
setFieldError("caseBloodTypeError", "");
}

function renderCaseList() {
const notes = getSavedNotes().slice(0, 5);

if (!notes.length) {
return emptyState("لا توجد حالات مضافة بعد", "الحالات التي تسجلها ستظهر هنا مباشرة.");
}

return `
<ul class="divide-y divide-slate-100 rounded-xl border border-slate-100">
${notes
.map(
(note) => `
<li class="flex flex-col gap-2 p-3 transition duration-300 sm:flex-row sm:items-start sm:justify-between ${
note.id === editingNoteId ? "bg-teal-50/40" : ""
}">
<div class="min-w-0">
<a href="patient-details.html?id=${encodeURIComponent(note.patientId)}" class="text-sm font-bold text-slate-900 transition duration-300 hover:text-teal-700">${escapeHtml(note.patientName)}</a>
<p class="mt-1 text-sm leading-7 text-slate-600">${escapeHtml(note.text)}</p>
<p class="mt-1 text-[11px] text-slate-400">
${escapeHtml(note.author || "")} — ${escapeHtml(formatDateTime(note.createdAt))}
${note.updatedAt ? ` — عُدّلت ${escapeHtml(formatDateTime(note.updatedAt))}` : ""}
</p>
</div>
<div class="flex shrink-0 items-center gap-2">
${notePriorityBadge(note.priority)}
<button type="button" data-edit-note="${escapeHtml(note.id)}" aria-label="تعديل الملاحظة" class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-200">
${icon("pencil", "h-3.5 w-3.5")}
</button>
<button type="button" data-delete-note="${escapeHtml(note.id)}" aria-label="حذف الملاحظة" class="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition duration-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200">
${icon("trash-2", "h-3.5 w-3.5")}
</button>
</div>
</li>`
)
.join("")}
</ul>
`;
}

function refreshCaseList() {
document.getElementById("caseAlertsList").innerHTML = renderCaseList();
renderIcons();
}

// حالة الرعاية الأشد بترفع تصنيف المريض، فأرقام البطاقات فوق بتتحرك على طول عند التلاتة
function applyCaseEscalation(patient, priority) {
const nextCondition = escalateCondition(patient.condition, priority);

if (!nextCondition) {
return;
}

saveStatusOverride(patient.id, nextCondition);

// الإشعار بيوصل للتلاتة ومعه اسم اللي سجّل الحالة والسبب
addActivity({ patientId: patient.id, title: "تغيّر حالة مريض", message: `أصبحت حالة ${patient.name} «${nextCondition}» بعد تسجيل حالة رعاية.`, reason: `حالة رعاية ${translateNotePriority(priority)} رفعت تصنيف المريض`, iconName: nextCondition === conditions.critical ? "triangle-alert" : "clipboard-list", link: `patient-details.html?id=${encodeURIComponent(patient.id)}` });
}

function bindCareCaseForm() {
const form = document.getElementById("careCaseForm");

if (!form) {
return;
}

const caseList = document.getElementById("caseAlertsList");

document.getElementById("casePatient").addEventListener("change", toggleCaseCompletionFields);

form.addEventListener("submit", async (event) => {
event.preventDefault();

const patientId = document.getElementById("casePatient").value;
const priority = document.getElementById("casePriority").value;
const text = document.getElementById("caseNote").value.trim();
const patient = allPatients.find((item) => item.id === patientId);

setFieldError("casePatientError", patient ? "" : "يرجى اختيار المريض أولًا.");
setFieldError("caseNoteError", text.length >= 5 ? "" : "يرجى كتابة ملاحظة لا تقل عن خمسة أحرف.");

if (!patient || text.length < 5) {
return;
}

// إذا ملف المريض ناقص، لازم التشخيص وفصيلة الدم ينعبّوا هون قبل ما نكمل — هيك بيصير الملف كامل بخطوة وحدة
const needsCompletion = !hasCompleteClinicalProfile(patient);
const diagnosis = document.getElementById("caseDiagnosis").value.trim();
const bloodType = document.getElementById("caseBloodType").value;

if (needsCompletion) {
setFieldError("caseDiagnosisError", diagnosis.length >= 3 ? "" : "أدخل التشخيص كاملًا.");
setFieldError("caseBloodTypeError", bloodType ? "" : "اختر فصيلة الدم.");

if (diagnosis.length < 3 || !bloodType) {
return;
}

updatePatient(patient.id, { diagnosis, bloodType });

// الإشعار بيوصل للتلاتة ومعه اسم اللي أكمل الملف والسبب
addActivity({ patientId: patient.id, title: "اكتمال ملف مريض", message: `تم استكمال التشخيص وفصيلة الدم لملف ${patient.name}.`, reason: `التشخيص: ${diagnosis} — فصيلة الدم: ${bloodType}`, iconName: "clipboard-check", link: `patient-details.html?id=${encodeURIComponent(patient.id)}` });
}

const priorityLabel = translateNotePriority(priority);

if (editingNoteId) {
updateNote(editingNoteId, { patientId: patient.id, patientName: patient.name, priority, text });

// الإشعار بيوصل للتلاتة ومعه اسم اللي عدّل والسبب
addActivity({ patientId: patient.id, title: "تعديل حالة رعاية", message: `تم تعديل حالة ${priorityLabel} للمريض ${patient.name}.`, reason: `تحديث نص الحالة ونوعها صار «${priorityLabel}»`, iconName: "pencil", link: `patient-details.html?id=${encodeURIComponent(patient.id)}` });

showToast("تم حفظ تعديل الحالة.");
} else {
saveNote({ patientId: patient.id, patientName: patient.name, priority, text, author: currentUserName });

// الإشعار بيوصل للتلاتة ومعه اسم اللي أضاف والسبب
addActivity({ patientId: patient.id, title: "تمت إضافة حالة جديدة", message: `${currentUserName} أضاف حالة ${priorityLabel} للمريض ${patient.name}.`, reason: text, iconName: priority === "critical" ? "triangle-alert" : "clipboard-plus", link: `patient-details.html?id=${encodeURIComponent(patient.id)}` });

showToast("تم تسجيل الحالة وإرسال التنبيه.");
}

applyCaseEscalation(patient, priority);

resetCaseForm();
await refreshDashboard();
refreshAlerts();
});

form.addEventListener("reset", () => {
setFieldError("casePatientError", "");
setFieldError("caseNoteError", "");
setFieldError("caseDiagnosisError", "");
setFieldError("caseBloodTypeError", "");
document.getElementById("caseCompletionFields").classList.add("hidden");
});

document.getElementById("cancelCaseEdit").addEventListener("click", () => {
resetCaseForm();
refreshCaseList();
});

// مستمع واحد على القائمة بيخدم كل أزرار التعديل والحذف
caseList.addEventListener("click", async (event) => {
const editButton = event.target.closest("[data-edit-note]");
const deleteButton = event.target.closest("[data-delete-note]");

if (editButton) {
const note = getSavedNotes().find((item) => item.id === editButton.dataset.editNote);

if (note) {
fillCaseFormForEdit(note);
refreshCaseList();
}

return;
}

if (!deleteButton) {
return;
}

const note = getSavedNotes().find((item) => item.id === deleteButton.dataset.deleteNote);

const confirmed = await confirmDialog({ title: "حذف الحالة", message: `سيتم حذف الحالة المسجلة على ملف ${note.patientName} ولا يمكن التراجع عن العملية.`, confirmLabel: "حذف" });

if (!confirmed) {
return;
}

deleteNote(note.id);

if (editingNoteId === note.id) {
resetCaseForm();
}

// الإشعار بيوصل للتلاتة ومعه اسم اللي حذف والسبب
addActivity({ patientId: note.patientId, title: "حذف حالة رعاية", message: `تم حذف حالة مسجلة على ملف ${note.patientName}.`, reason: `الحالة المحذوفة كانت: ${note.text}`, iconName: "trash-2", link: `patient-details.html?id=${encodeURIComponent(note.patientId)}` });

await refreshDashboard();
showToast("تم حذف الحالة.", "info");
refreshAlerts();
});
}

// الصناديق السفلية: بنبني القوائم اللي جوا كل صندوق من البيانات، والقوائم بتختلف بين الطاقم الطبي والاستقبال

function setList(name, html) {
const container = document.querySelector(`[data-list="${name}"]`);

if (container) {
container.innerHTML = html;
}
}

function fillSections(patients, appointments) {
const todayAppointments = appointments.filter((appointment) => appointment.date === todayIso());
const upcomingAppointments = appointments.filter(isUpcomingAppointment);

setList("today", compactAppointmentList(todayAppointments, "لا توجد مواعيد مسجلة لليوم."));
setList("upcoming", compactAppointmentList(upcomingAppointments.slice(0, 6), "لا توجد مواعيد قادمة."));

if (isReceptionist) {
const scheduled = appointments.filter((appointment) => appointment.status === appointmentStatuses.scheduled);

setList("scheduled", compactAppointmentList(scheduled.slice(0, 8), "لا توجد مواعيد مجدولة."));
setList("newPatients", compactPatientList(patients.slice(-5).reverse(), "لا يوجد مرضى مسجلون.", true, false));
return;
}

setList("critical", compactPatientList(patients.filter((patient) => patient.condition === conditions.critical), "لا توجد حالات حرجة حاليًا."));
setList("followUp", compactPatientList(patients.filter((patient) => patient.condition === conditions.followUp), "لا توجد حالات متابعة حاليًا."));
}

// «أحدث المرضى» = آخر المرضى اللي صار على ملفهم إجراء، مش آخر المسجّلين.
// الترتيب بيعتمد على آخر وقت إجراء لكل مريض، والمصدر سجل الإجراءات.
function fillRecentPatients(patients) {
const recent = getRecentlyUpdatedPatients(patients, getActivityLog(), 6);

if (!recent.length) {
setList("recent", emptyState("لا توجد تحديثات بعد", "أي إضافة أو تعديل على ملف مريض ستظهر هنا مباشرة."));
return;
}

setList("recent", `
<ul class="divide-y divide-slate-100">
${recent
.map(
({ patient, updatedAt, action }) => `
<li>
<a href="patient-details.html?id=${encodeURIComponent(patient.id)}" class="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition duration-300 hover:bg-slate-50">
<span class="flex min-w-0 items-center gap-3">
<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">${escapeHtml(getInitials(patient.name))}</span>
<span class="min-w-0">
<span class="block truncate text-sm font-bold text-slate-900">${escapeHtml(patient.name)}</span>
<span class="block truncate text-xs text-slate-500">${escapeHtml(action)}</span>
<span class="block text-[11px] text-slate-400">${escapeHtml(formatDateTime(updatedAt))}</span>
</span>
</span>
${conditionBadge(patient.condition)}
</a>
</li>`
)
.join("")}
</ul>
`);
}

// أحدث القراءات: صندوقا المتوسطات وقشرة الجدول مكتوبين بالصفحة، وهون الصفوف
function fillVitalsOverview(vitals) {
const overview = document.getElementById("vitalsOverview");
const empty = document.getElementById("vitalsOverviewEmpty");
const hasVitals = vitals.length > 0;

overview.classList.toggle("hidden", !hasVitals);
empty.classList.toggle("hidden", hasVitals);

document.getElementById("dashboardVitalsRows").innerHTML = vitals
.slice(0, 6)
.map(
(record) => `
<tr class="transition duration-300 hover:bg-slate-50">
<td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">${escapeHtml(record.patientName)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.heartRate)} نبضة/دقيقة</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.bloodPressure)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(record.oxygenLevel)}%</td>
<td class="whitespace-nowrap px-4 py-3">${readingBadge(getReadingStatus(record))}</td>
</tr>
`
)
.join("");
}

// التشغيل: بنجيب البيانات وبنعبّي اللوحة، وبنربط النماذج مرة وحدة بس حتى ما يتراكم أكتر من مستمع على نفس النموذج

// بنجيب أحدث بيانات وبنخزنها بحالة الصفحة، عشان النماذج تقرأ منها
async function loadPageData() {
allPatients = await getPatients();
allAppointments = await getAppointmentsWithPatients();

// سجل القراءات سريري، فما منجيبه للاستقبال أصلًا
const vitals = isReceptionist ? [] : await getVitalRecords();

return { patients: allPatients, appointments: allAppointments, vitals };
}

// بننادي عليها بعد أي إضافة أو تعديل أو حذف، ومن إشارة التغيير اللي جاية من زميل تاني.
// بتعيد تعبئة الأرقام والقوائم بس — النماذج بتضل مربوطة كما هي.
async function refreshDashboard() {
const { patients, appointments, vitals } = await loadPageData();

fillStats(calculateStats(patients, appointments, vitals));
fillSections(patients, appointments);

if (!isReceptionist) {
fillRecentPatients(patients);
fillVitalsOverview(vitals);
fillCasePatientOptions();
refreshCaseList();
}

renderIcons();
}

async function loadDashboard() {
const loading = document.getElementById("dashboardLoading");
const errorBox = document.getElementById("dashboardError");
const body = document.getElementById("dashboardBody");

try {
await refreshDashboard();

loading.classList.add("hidden");
errorBox.classList.add("hidden");
body.classList.remove("hidden");
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
const context = await initPage("dashboard");

if (!context) {
return;
}

currentUserName = context.user ? context.user.name : "";
isReceptionist = context.isReceptionist;

if (currentUserName) {
document.getElementById("dashboardTitle").textContent = `مرحبًا، ${currentUserName}`;
}

// النماذج والمربعات مكتوبة بالـHTML، فبنربطها مرة وحدة
// وrefreshDashboard ما بتلمس ربطها، عشان ما يتراكم أكثر من مستمع على نفس النموذج
bindQuickActions();
bindPatientRegistrationForm();
bindCareCaseForm();
document.getElementById("retryDashboard").addEventListener("click", loadDashboard);

await loadDashboard();

// أي تغيير من زميل تاني — طبيب أو ممرضة أو استقبال — بيوصل لهون وبتتحدث الأرقام لحالها
onDataChange(() => refreshDashboard());
}

start();
