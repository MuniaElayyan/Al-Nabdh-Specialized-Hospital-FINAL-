// مكوّنات الواجهة المشتركة، كل دالة بترجّع HTML جاهز أو بتتحكم بعنصر مشترك

import {
escapeHtml,
formatDate,
formatTime,
formatTextValue,
todayIso,
earliestTimeForDate,
conditions,
appointmentStatuses,
readingStatuses,
translateNotePriority
} from "./helpers.js";

// الأيقونة زخرفية جنب النص، فبنخفيها عن قارئ الشاشة
export function icon(name, classes = "h-5 w-5") {
return `<i data-lucide="${name}" class="${classes}" aria-hidden="true"></i>`;
}

export function renderIcons() {
if (window.lucide) {
window.lucide.createIcons();
}
}

// زر التعديل الموحّد لكل الجداول — زر واحد بعمود الإجراءات، وباقي التفاصيل بتنفتح باللوحة
export function editRowButton(recordId, label = "تعديل") {
return `
<button type="button" data-edit-id="${escapeHtml(recordId)}" class="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-surface px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200">
${icon("pencil", "h-3.5 w-3.5")}
${escapeHtml(label)}
</button>
`;
}

// السجلات اللي ما بتنعدّل (سجل المستشفى الثابت أو قراءة زميل) بتعرض السبب بدل الزر
export function lockedRowNote(reason) {
return `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">${icon("lock", "h-3.5 w-3.5")}${escapeHtml(reason)}</span>`;
}

// الشارات: شارة ملوّنة صغيرة بتوصف حالة المريض أو الموعد أو القراءة، ولون كل حالة ثابت بكل الشاشات

function badge(text, classes, dotClass) {
return `
<span class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}">
<span class="h-1.5 w-1.5 rounded-full ${dotClass}" aria-hidden="true"></span>
${escapeHtml(text)}
</span>
`;
}

const neutralBadgeStyle = ["bg-slate-100 text-slate-600 ring-slate-200", "bg-slate-400"];

export function conditionBadge(condition) {
const styles = { [conditions.stable]: ["bg-emerald-50 text-emerald-700 ring-emerald-200", "bg-emerald-500"], [conditions.critical]: ["bg-rose-50 text-rose-700 ring-rose-200", "bg-rose-500"], [conditions.followUp]: ["bg-amber-50 text-amber-700 ring-amber-200", "bg-amber-500"] };
const [classes, dotClass] = styles[condition] || neutralBadgeStyle;

return badge(condition, classes, dotClass);
}

export function appointmentBadge(status) {
const styles = { [appointmentStatuses.scheduled]: ["bg-sky-50 text-sky-700 ring-sky-200", "bg-sky-500"], [appointmentStatuses.urgent]: ["bg-rose-50 text-rose-700 ring-rose-200", "bg-rose-500"], [appointmentStatuses.completed]: ["bg-slate-100 text-slate-600 ring-slate-200", "bg-slate-400"] };
const [classes, dotClass] = styles[status] || neutralBadgeStyle;

return badge(status, classes, dotClass);
}

export function readingBadge(status) {
const styles = { [readingStatuses.normal]: ["bg-emerald-50 text-emerald-700 ring-emerald-200", "bg-emerald-500"], [readingStatuses.warning]: ["bg-amber-50 text-amber-700 ring-amber-200", "bg-amber-500"], [readingStatuses.critical]: ["bg-rose-50 text-rose-700 ring-rose-200", "bg-rose-500"], [readingStatuses.notRecorded]: neutralBadgeStyle };
const [classes, dotClass] = styles[status] || neutralBadgeStyle;

return badge(status, classes, dotClass);
}

export function notePriorityBadge(priority) {
const styles = { followUp: ["bg-teal-50 text-teal-700 ring-teal-200", "bg-teal-500"], urgent: ["bg-amber-50 text-amber-700 ring-amber-200", "bg-amber-500"], critical: ["bg-rose-50 text-rose-700 ring-rose-200", "bg-rose-500"], routine: neutralBadgeStyle };
const [classes, dotClass] = styles[priority] || styles.followUp;

return badge(translateNotePriority(priority), classes, dotClass);
}

// حالات الواجهة: التلات شاشات اللي بتتكرر بكل صفحة — جاري التحميل، صار خطأ، وما في نتائج

export function loadingState(message = "جاري تحميل البيانات...") {
return `
<div class="animate-fadeIn flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-surface p-8 shadow-sm" role="status">
<div class="flex items-center gap-3 text-slate-500">
<span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" aria-hidden="true"></span>
<span class="text-sm font-medium">${escapeHtml(message)}</span>
</div>
</div>
`;
}

export function errorState(message = "تعذر تحميل البيانات. يرجى المحاولة مرة أخرى.", retryId = "") {
return `
<div class="animate-pop rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
<span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-rose-600">
${icon("triangle-alert")}
</span>
<p class="mt-3 text-sm font-semibold text-rose-800">${escapeHtml(message)}</p>
${
retryId
? `<button id="${retryId}" type="button" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-danger to-danger-dark hover:from-danger-dark hover:to-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-rose-300">
${icon("rotate-cw", "h-4 w-4")}
إعادة المحاولة
</button>`
: ""
}
</div>
`;
}

export function emptyState(title, description = "") {
return `
<div class="animate-fadeIn rounded-2xl border border-dashed border-slate-300 bg-surface p-8 text-center">
<span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
${icon("inbox")}
</span>
<h3 class="mt-3 text-sm font-bold text-slate-800">${escapeHtml(title)}</h3>
${description ? `<p class="mt-1 text-sm text-slate-500">${escapeHtml(description)}</p>` : ""}
</div>
`;
}

// قوائم مختصرة: قوائم المرضى والمواعيد اللي بتطلع جوا صناديق لوحة التحكم

// قائمة مرضى مختصرة: linked = false بتشيل الرابط، و showClinical = false بتبدّل السريري ببيانات التسجيل
export function compactPatientList(patients, emptyMessage = "لا يوجد مرضى ضمن هذا العرض.", linked = true, showClinical = true) {
if (!patients.length) {
return emptyState("لا توجد سجلات", emptyMessage);
}

const rowClasses = "flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition duration-300";

return `
<ul class="divide-y divide-slate-100">
${patients
.map((patient) => {
const subtitle = showClinical
? `${escapeHtml(patient.age)} سنة — ${escapeHtml(formatTextValue(patient.diagnosis))}`
: `${escapeHtml(patient.age)} سنة — ${escapeHtml(patient.gender)}`;

const trailing = showClinical
? conditionBadge(patient.condition)
: `<span class="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">${escapeHtml(patient.phone)}</span>`;

const body = `
<span class="min-w-0">
<span class="block truncate text-sm font-bold text-slate-900">${escapeHtml(patient.name)}</span>
<span class="block text-xs text-slate-500">${subtitle}</span>
</span>
${trailing}
`;

return linked
? `<li>
<a href="patient-details.html?id=${encodeURIComponent(patient.id)}" class="${rowClasses} hover:bg-slate-50">${body}</a>
</li>`
: `<li><div class="${rowClasses}">${body}</div></li>`;
})
.join("")}
</ul>
`;
}

export function compactAppointmentList(appointments, emptyMessage = "لا توجد مواعيد ضمن هذا العرض.") {
if (!appointments.length) {
return emptyState("لا توجد مواعيد", emptyMessage);
}

return `
<ul class="divide-y divide-slate-100">
${appointments
.map(
(appointment) => `
<li class="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
<div class="min-w-0">
<p class="truncate text-sm font-bold text-slate-900">${escapeHtml(appointment.patient ? appointment.patient.name : "")}</p>
<p class="mt-1 text-xs text-slate-500">${escapeHtml(formatDate(appointment.date))} — ${escapeHtml(formatTime(appointment.time))}</p>
<p class="mt-1 text-xs text-slate-400">${escapeHtml(appointment.reason)}</p>
</div>
${appointmentBadge(appointment.status)}
</li>`
)
.join("")}
</ul>
`;
}

// رسائل النجاح: تنبيه صغير بيطلع تحت على الشمال بعد أي عملية وبيختفي لحاله بعد كم ثانية

function getToastContainer() {
let container = document.getElementById("toastContainer");

if (!container) {
container = document.createElement("div");
container.id = "toastContainer";
container.className = "fixed bottom-4 left-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2";
container.setAttribute("aria-live", "polite");
document.body.appendChild(container);
}

return container;
}

// تنبيه صغير أسفل الشاشة بيختفي لحاله بعد كم ثانية
export function showToast(message, type = "success") {
const styles = { success: ["border-emerald-200 bg-surface text-emerald-800", "bg-emerald-50 text-emerald-600", "check-circle-2"], error: ["border-rose-200 bg-surface text-rose-800", "bg-rose-50 text-rose-600", "triangle-alert"], info: ["border-slate-200 bg-surface text-slate-800", "bg-slate-100 text-slate-600", "info"] };
const [boxClasses, iconClasses, iconName] = styles[type] || styles.info;

const toast = document.createElement("div");
toast.className = `flex items-center gap-3 rounded-2xl border p-3 shadow-lg transition duration-300 ${boxClasses}`;
toast.innerHTML = `
<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClasses}">${icon(iconName, "h-4 w-4")}</span>
<p class="text-sm font-semibold">${escapeHtml(message)}</p>
`;

getToastContainer().appendChild(toast);
renderIcons();

setTimeout(() => {
toast.classList.add("opacity-0", "translate-y-2");
setTimeout(() => toast.remove(), 300);
}, 3200);
}

// نافذة التأكيد: بتوقف العمليات الحساسة لحد ما المستخدم يأكد، وبترجّع Promise بـtrue أو false

export function confirmDialog({ title, message, confirmLabel = "تأكيد", tone = "rose" }) {
return new Promise((resolve) => {
const confirmClasses =
tone === "rose"
? "bg-gradient-to-l from-danger to-danger-dark hover:from-danger-dark hover:to-danger focus:ring-rose-300"
: "bg-gradient-to-l from-brand to-brand-dark hover:from-brand-dark hover:to-brand focus:ring-teal-300";

const overlay = document.createElement("div");
overlay.className = "animate-fadeIn fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm";
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.innerHTML = `
<div class="animate-pop w-full max-w-md rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl">
<h2 class="text-lg font-bold text-slate-900">${escapeHtml(title)}</h2>
<p class="mt-2 text-sm leading-7 text-slate-500">${escapeHtml(message)}</p>
<div class="mt-6 flex flex-wrap justify-end gap-2">
<button type="button" data-dialog-cancel class="inline-flex items-center rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300">إلغاء</button>
<button type="button" data-dialog-confirm class="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-300 focus:outline-none focus:ring-2 ${confirmClasses}">${escapeHtml(confirmLabel)}</button>
</div>
</div>
`;

function close(result) {
document.removeEventListener("keydown", onKeyDown);
overlay.remove();
resolve(result);
}

function onKeyDown(event) {
if (event.key === "Escape") {
close(false);
}
}

overlay.querySelector("[data-dialog-cancel]").addEventListener("click", () => close(false));
overlay.querySelector("[data-dialog-confirm]").addEventListener("click", () => close(true));
overlay.addEventListener("click", (event) => {
if (event.target === overlay) {
close(false);
}
});
document.addEventListener("keydown", onKeyDown);

document.body.appendChild(overlay);
overlay.querySelector("[data-dialog-confirm]").focus();
});
}

// أنماط حقول النماذج: كلاسات موحّدة للحقول والأزرار، ودالتين بيحدّدوا الحقل الخاطئ بأحمر وبيعرضوا رسالته

export const inputClasses =
"h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export const labelClasses = "text-xs font-semibold text-slate-500";

export const primaryButtonClasses =
"inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand to-brand-dark hover:from-brand-dark hover:to-brand px-4 text-sm font-semibold text-white shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-300";

export const secondaryButtonClasses =
"inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300";

// كلاسات تمييز الحقل الخاطئ — Tailwind بدل كلاس CSS مخصص
const invalidFieldClasses = ["border-rose-500", "ring-2", "ring-rose-200"];

// بنحدّد الحقل بإطار أحمر أو بنشيله. بنستعملها بكل النماذج بدل تكرار الكلاسات.
export function setFieldInvalid(element, isInvalid) {
if (!element) {
return;
}

element.classList.toggle(invalidFieldClasses[0], isInvalid);
element.classList.toggle(invalidFieldClasses[1], isInvalid);
element.classList.toggle(invalidFieldClasses[2], isInvalid);
}

// حدود حقلي التاريخ والوقت بأي نموذج موعد: حقل التاريخ ما بيقبل يوم فات، وإذا اليوم
// المختار هو اليوم بيصير حقل الوقت كمان ما بيقبل ساعة مضت. بنعيد الحساب مع كل تغيير
// للتاريخ وقبل ما المستخدم يفتح حقل الوقت، فالحدود بتضل مضبوطة حتى لو ضلت الصفحة
// مفتوحة والوقت ماشي. هاد إرشاد بالواجهة — الرفض الحقيقي بطبقة قواعد المواعيد.
// بترجّع دالة الضبط نفسها، عشان النموذج يعيد استدعاءها بعد ما يفضّي حقوله.
export function limitToFutureSlots(dateInput, timeInput) {
function syncLimits() {
if (!dateInput || !timeInput) {
return;
}

dateInput.min = todayIso();

const earliestTime = earliestTimeForDate(dateInput.value);

if (earliestTime) {
timeInput.min = earliestTime;
} else {
timeInput.removeAttribute("min");
}
}

if (dateInput && timeInput) {
dateInput.addEventListener("change", syncLimits);
timeInput.addEventListener("focus", syncLimits);
}

syncLimits();

return syncLimits;
}

// بنظهر أو بنخفي رسالة الخطأ تحت الحقل
export function setFieldError(errorElementId, message) {
const errorElement = document.getElementById(errorElementId);

if (!errorElement) {
return;
}

errorElement.textContent = message;
errorElement.classList.toggle("hidden", !message);
}
