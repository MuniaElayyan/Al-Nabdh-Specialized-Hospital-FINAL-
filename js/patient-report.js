// ملف المريض الكامل: بيجمع كل معلومة مخزّنة عن المريض من مصادرها المتفرقة،
// وبيقدّمها بشكلين — لوحة تفاصيل داخل الصفحة، وكشف قابل للتنزيل.
//
// الفكرة اللي بتمنع التكرار: بنبني "الأقسام" مرة وحدة كبيانات مجرّدة
// (عنوان + نوع + صفوف)، وبعدين في راسمين بياخدوا نفس الأقسام:
//   1) renderDetailsPanel — بكلاسات Tailwind، بتنعرض جوا الموقع
//   2) buildReportDocument — ملف HTML مستقل بستايله، بينزّل على جهاز المستخدم
// فلو زدنا معلومة بالكشف، بتزيد بالمكانين مع بعض.

import { getPatients, getAppointmentsWithPatients, getVitalRecords } from "./api.js";
import { getPatientNotes } from "./storage.js";
import {
escapeHtml,
formatDate,
formatTime,
formatDateTime,
formatTextValue,
formatVitalValue,
getReadingStatus,
translateNotePriority,
isUpcomingAppointment,
missingValueLabel,
appointmentStatuses
} from "./helpers.js";
import { icon, renderIcons, primaryButtonClasses, secondaryButtonClasses } from "./ui.js";

const systemName = "مستشفى النبض التخصصي لأمراض القلب";

// أسماء الحقول بالعربي. أي حقل جديد ينضاف لبيانات المريض بيطلع بالكشف حتى لو
// مش مكتوب هون — بس بمفتاحه الإنجليزي، فالإضافة عليه بتكون واضحة.
const fieldLabels = {
id: "رقم الملف",
name: "اسم المريض",
nationalId: "رقم الهوية",
phone: "رقم الهاتف",
gender: "الجنس",
age: "العمر",
bloodType: "فصيلة الدم",
condition: "حالة المريض",
diagnosis: "التشخيص",
heartRate: "نبض القلب",
bloodPressure: "ضغط الدم",
oxygenLevel: "مستوى الأكسجين",
lastReadingAt: "وقت القراءة المرجعية",
doctorId: "رقم الطبيب المعالج"
};

// بيانات التسجيل: هاي الحقول اللي بيعبّيها موظف الاستقبال بلوحة التحكم،
// وهي الوحيدة اللي بتبيّن له — الباقي سريري وخارج صلاحيته.
const registrationFields = ["id", "name", "nationalId", "phone", "gender", "age"];

// حقول سريرية بيشوفها الطبيب والممرضة بس
const clinicalFields = ["bloodType", "condition", "diagnosis"];

// حقول داخلية ما إلها معنى بالكشف
const hiddenFields = ["heartRate", "bloodPressure", "oxygenLevel", "lastReadingAt", "doctorId"];

// جمع البيانات: بنلمّ كل شي مخزّن عن المريض من مصادره المتفرقة بطلب واحد
// ---------------------------------------------------------------------------

// بنجيب كل شي مخزّن عن هالمريض: بياناته، قراءاته، مواعيده، وملاحظاته
export async function collectPatientRecord(patientId) {
const [patients, appointments, vitals] = await Promise.all([getPatients(), getAppointmentsWithPatients(), getVitalRecords()]);
const patient = patients.find((item) => String(item.id) === String(patientId));

if (!patient) {
return null;
}

return {
patient,
appointments: appointments.filter((appointment) => String(appointment.patientId) === String(patient.id)),
vitals: vitals.filter((record) => String(record.patientId) === String(patient.id)),
notes: getPatientNotes(patient.id)
};
}

// بناء الأقسام: بنجهّز محتوى الكشف كبيانات مجرّدة مرة وحدة، وبعدين الراسمين التنين بياخدوا نفس النتيجة
// ---------------------------------------------------------------------------

// بترجّع صفوف "الحقل: القيمة" للبيانات الأساسية.
// showClinical = false يعني موظف استقبال: بيانات التسجيل بس.
function buildProfileRows(patient, showClinical) {
const shownFields = showClinical ? [...registrationFields, ...clinicalFields] : registrationFields;

const rows = shownFields.map((field) => [fieldLabels[field], formatTextValue(patient[field])]);

// أي حقل إضافي انحفظ على المريض وما هو بقائمتنا — بيطلع كمان،
// عشان الكشف يضل يعرض "كل معلوماته المخزنة" حتى لو النظام توسّع
if (showClinical) {
Object.keys(patient)
.filter((field) => !shownFields.includes(field) && !hiddenFields.includes(field) && !fieldLabels[field])
.forEach((field) => rows.push([field, formatTextValue(patient[field])]));
}

return rows;
}

function buildVitalRows(patient) {
return [
[fieldLabels.heartRate, formatVitalValue(patient.heartRate, " نبضة/دقيقة")],
[fieldLabels.bloodPressure, formatVitalValue(patient.bloodPressure)],
[fieldLabels.oxygenLevel, formatVitalValue(patient.oxygenLevel, "%")],
["حالة القراءة", getReadingStatus(patient)],
[fieldLabels.lastReadingAt, patient.lastReadingAt ? formatDateTime(patient.lastReadingAt) : missingValueLabel]
];
}

// وسم الموعد: قادم أو سابق أو مكتمل — نفس القاعدة المستعملة بباقي الشاشات
function appointmentState(appointment) {
if (appointment.status === appointmentStatuses.completed) {
return "مكتمل";
}

return isUpcomingAppointment(appointment) ? "قادم" : "سابق";
}

// هون بنقرر شو بيدخل بالكشف. الراسمين التنين بياخدوا نفس النتيجة.
export function buildSections(record, showClinical) {
const { patient, appointments, vitals, notes } = record;

const sections = [
{ title: "البيانات الأساسية", type: "fields", rows: buildProfileRows(patient, showClinical) }
];

if (showClinical) {
sections.push({ title: "المؤشرات الحيوية الحالية", type: "fields", rows: buildVitalRows(patient) });

sections.push({
title: "سجل القراءات الحيوية",
type: "table",
headers: ["نبض القلب", "ضغط الدم", "الأكسجين", "حالة القراءة", "سجّلها", "وقت التسجيل"],
rows: vitals.map((item) => [
formatVitalValue(item.heartRate, " نبضة/دقيقة"),
formatVitalValue(item.bloodPressure),
formatVitalValue(item.oxygenLevel, "%"),
getReadingStatus(item),
item.isSaved ? item.recordedBy || missingValueLabel : "سجل المستشفى",
item.recordedAt ? formatDateTime(item.recordedAt) : missingValueLabel
]),
emptyMessage: "لا توجد قراءات حيوية مسجلة لهذا المريض."
});
}

sections.push({
title: "المواعيد",
type: "table",
headers: ["التاريخ", "الوقت", "الحالة", "سبب الزيارة", "الوضع"],
rows: appointments.map((item) => [
formatDate(item.date),
formatTime(item.time),
item.status,
formatTextValue(item.reason),
appointmentState(item)
]),
emptyMessage: showClinical ? "لا توجد مواعيد مرتبطة بهذا الملف." : "لا توجد مواعيد مسجلة لهذا المريض."
});

if (showClinical) {
sections.push({
title: "الملاحظات الطبية والتمريضية",
type: "table",
headers: ["الملاحظة", "نوع الحالة", "كتبها", "وقت الكتابة"],
rows: notes.map((note) => [
note.text,
translateNotePriority(note.priority),
formatTextValue(note.author),
formatDateTime(note.createdAt) + (note.updatedAt ? ` (عُدّلت ${formatDateTime(note.updatedAt)})` : "")
]),
emptyMessage: "لم تُسجَّل ملاحظات على هذا الملف بعد."
});
}

return sections;
}

// الراسم الأول: لوحة التفاصيل داخل الموقع
// ---------------------------------------------------------------------------

function renderFieldsSection(section) {
return `
<dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
${section.rows
.map(
([label, value]) => `
<div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
<dt class="text-xs font-semibold text-slate-500">${escapeHtml(label)}</dt>
<dd class="mt-1 break-words text-sm font-bold text-slate-900">${escapeHtml(value)}</dd>
</div>`
)
.join("")}
</dl>
`;
}

function renderTableSection(section) {
if (!section.rows.length) {
return `<p class="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">${escapeHtml(section.emptyMessage)}</p>`;
}

return `
<div class="overflow-x-auto rounded-xl border border-slate-200">
<table class="min-w-full divide-y divide-slate-200 text-right text-sm">
<thead class="bg-slate-50 text-xs font-semibold text-slate-500">
<tr>${section.headers.map((header) => `<th scope="col" class="whitespace-nowrap px-3 py-2">${escapeHtml(header)}</th>`).join("")}</tr>
</thead>
<tbody class="divide-y divide-slate-100">
${section.rows
.map((row) => `<tr>${row.map((cell) => `<td class="px-3 py-2 text-slate-600">${escapeHtml(cell)}</td>`).join("")}</tr>`)
.join("")}
</tbody>
</table>
</div>
`;
}

function renderSections(sections) {
return sections
.map(
(section) => `
<section class="mt-5 first:mt-0">
<h3 class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
<span class="h-4 w-1 rounded-full bg-teal-500" aria-hidden="true"></span>
${escapeHtml(section.title)}
</h3>
${section.type === "fields" ? renderFieldsSection(section) : renderTableSection(section)}
</section>`
)
.join("");
}

// اللوحة المفتوحة حاليًا — وحدة بس، فأي فتح جديد بيستبدل القديمة
let activeMount = null;

export function closeDetailsPanel() {
if (!activeMount) {
return;
}

activeMount.innerHTML = "";
activeMount = null;
document.removeEventListener("keydown", onEscape);
}

function onEscape(event) {
if (event.key === "Escape") {
closeDetailsPanel();
}
}

/**
 * بتفتح لوحة تفاصيل المريض فوق الجدول.
 *
 * mount        العنصر اللي بتنرسم جواته
 * record       ناتج collectPatientRecord
 * showClinical false لموظف الاستقبال: بيانات التسجيل والمواعيد بس
 * onEdit       اختيارية — لو مرّرناها بيبيّن زر تعديل داخل اللوحة
 */
export function openDetailsPanel({ mount, record, showClinical = true, onEdit = null, onClose = null }) {
const container = typeof mount === "string" ? document.getElementById(mount) : mount;

if (!container || !record) {
return;
}

closeDetailsPanel();

const { patient } = record;
const sections = buildSections(record, showClinical);
const scopeNote = showClinical
? "كل المعلومات المخزّنة عن هذا المريض في النظام."
: "بيانات التسجيل والمواعيد — البيانات السريرية خارج صلاحية الاستقبال.";

container.innerHTML = `
<section data-details-panel class="animate-slideDown mb-6 overflow-hidden rounded-2xl border border-teal-200 bg-surface shadow-lg" role="region" aria-label="تفاصيل المريض">
<div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-teal-50/70 p-5">
<div class="flex items-start gap-3">
<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-teal-700">${icon("file-text", "h-5 w-5")}</span>
<div>
<h2 class="text-base font-bold text-slate-900">تفاصيل ${escapeHtml(patient.name)}</h2>
<p class="mt-1 text-sm text-slate-500">${escapeHtml(scopeNote)}</p>
</div>
</div>
<button type="button" data-details-close aria-label="إغلاق التفاصيل" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition duration-300 hover:bg-slate-50">${icon("x", "h-4 w-4")}</button>
</div>

<div class="p-5">
${renderSections(sections)}

<div class="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
<button type="button" data-details-download class="${primaryButtonClasses}">
${icon("download", "h-4 w-4")}
تنزيل كشف المريض
</button>
${onEdit ? `<button type="button" data-details-edit class="${secondaryButtonClasses}">${icon("pencil", "h-4 w-4")} تعديل البيانات</button>` : ""}
<button type="button" data-details-close class="${secondaryButtonClasses}">${icon("x", "h-4 w-4")} إغلاق</button>
</div>
</div>
</section>
`;

activeMount = container;

container.querySelectorAll("[data-details-close]").forEach((button) => {
button.addEventListener("click", () => {
closeDetailsPanel();

if (onClose) {
onClose();
}
});
});

container.querySelector("[data-details-download]").addEventListener("click", () => downloadPatientReport(record, showClinical));

const editButton = container.querySelector("[data-details-edit]");

if (editButton && onEdit) {
editButton.addEventListener("click", () => {
closeDetailsPanel();
onEdit();
});
}

document.addEventListener("keydown", onEscape);
renderIcons();
container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// الراسم الثاني: الكشف القابل للتنزيل
// ---------------------------------------------------------------------------

// ملف HTML مستقل بستايله الخاص، عشان يفتح على أي جهاز بلا إنترنت
// وينطبع مباشرة كـPDF من المتصفح.
const reportStyles = `
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 32px; color: #12291d; background: #f4faf6; line-height: 1.7; }
.sheet { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #d2e6da; border-radius: 14px; padding: 32px; }
header { border-bottom: 3px solid #15834f; padding-bottom: 16px; margin-bottom: 24px; }
h1 { margin: 0 0 4px; font-size: 20px; color: #0d2419; }
.sub { color: #5a8270; font-size: 13px; margin: 0; }
.meta { margin-top: 12px; font-size: 12px; color: #5a8270; }
h2 { font-size: 15px; color: #116941; margin: 26px 0 10px; padding-right: 10px; border-right: 4px solid #22a163; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
th, td { border: 1px solid #d2e6da; padding: 8px 10px; text-align: right; vertical-align: top; }
th { background: #effaf3; color: #116941; font-weight: 600; white-space: nowrap; }
.fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.field { border: 1px solid #d2e6da; border-radius: 8px; padding: 10px 12px; background: #f8fcfa; }
.field dt { font-size: 11px; color: #5a8270; margin: 0; }
.field dd { margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #0d2419; word-break: break-word; }
.empty { border: 1px dashed #b8d8c6; border-radius: 8px; padding: 14px; text-align: center; color: #5a8270; font-size: 13px; }
footer { margin-top: 28px; border-top: 1px solid #d2e6da; padding-top: 12px; font-size: 11px; color: #7ca190; text-align: center; }
@media print {
  body { background: #fff; padding: 0; }
  .sheet { border: none; border-radius: 0; padding: 0; max-width: none; }
  h2 { break-after: avoid; }
  table, .fields { break-inside: auto; }
  tr { break-inside: avoid; }
}
`;

function reportSectionHtml(section) {
if (section.type === "fields") {
return `
<h2>${escapeHtml(section.title)}</h2>
<div class="fields">
${section.rows.map(([label, value]) => `<dl class="field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></dl>`).join("")}
</div>
`;
}

if (!section.rows.length) {
return `<h2>${escapeHtml(section.title)}</h2><p class="empty">${escapeHtml(section.emptyMessage)}</p>`;
}

return `
<h2>${escapeHtml(section.title)}</h2>
<table>
<thead><tr>${section.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
<tbody>${section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>
`;
}

// بتبني نص ملف الكشف كاملًا — دالة صافية، فسهل نختبرها لحالها
export function buildReportDocument(record, showClinical = true) {
const { patient } = record;
const sections = buildSections(record, showClinical);
const printedAt = formatDateTime(new Date().toISOString());
const scope = showClinical ? "كشف طبي كامل" : "كشف بيانات التسجيل والمواعيد";

return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>كشف المريض — ${escapeHtml(patient.name)}</title>
<style>${reportStyles}</style>
</head>
<body>
<div class="sheet">
<header>
<h1>${escapeHtml(systemName)}</h1>
<p class="sub">${escapeHtml(scope)} — ${escapeHtml(patient.name)}</p>
<p class="meta">رقم الملف: ${escapeHtml(patient.id)} &nbsp;·&nbsp; تاريخ إصدار الكشف: ${escapeHtml(printedAt)}</p>
</header>

${sections.map(reportSectionHtml).join("")}

<footer>هذا الكشف صادر آليًا من نظام ${escapeHtml(systemName)} ويعرض البيانات المسجّلة وقت الإصدار.</footer>
</div>
</body>
</html>`;
}

// اسم ملف آمن: بنشيل الرموز اللي ما بتنفع بأسماء الملفات
function toSafeFileName(text) {
return String(text).replace(/[\\/:*?"<>|]/g, "").trim().replace(/\s+/g, "-");
}

// المتصفح بيحتاج رابط الملف يضل شغّال لحد ما يخلص كتابة التنزيل على القرص.
// لو فضّينا الذاكرة بسرعة بينلغي التنزيل وهو بنصّه — وهاد بيصير فعليًا مع الملفات
// الكبيرة أو الأجهزة البطيئة. فبنستنى مدة مريحة قبل ما نفضّي.
const objectUrlLifetimeMs = 60000;

// بننشئ الملف بالذاكرة وبنضغط رابط تنزيل مخفي — بلا خادم وبلا مكتبات
export function downloadPatientReport(record, showClinical = true) {
const html = buildReportDocument(record, showClinical);
const blob = new Blob([html], { type: "text/html;charset=utf-8" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = `كشف-${toSafeFileName(record.patient.name)}-${new Date().toISOString().slice(0, 10)}.html`;

document.body.appendChild(link);
link.click();
link.remove();

setTimeout(() => URL.revokeObjectURL(url), objectUrlLifetimeMs);
}

// زر التفاصيل الموحّد لجداول المرضى — عمود لحاله جنب عمود الإجراءات
export function detailsRowButton(patientId) {
return `
<button type="button" data-details-id="${escapeHtml(patientId)}" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200">
${icon("eye", "h-3.5 w-3.5")}
عرض التفاصيل
</button>
`;
}
