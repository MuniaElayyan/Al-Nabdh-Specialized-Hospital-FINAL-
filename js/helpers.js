// دوال مساعدة عامة: الحالات، تنسيق التاريخ والوقت، وقراءة المؤشرات — ما إلها علاقة بالشاشة

// القيم زي ما هي بملفات البيانات، مكتوبة مرة وحدة هون بدل ما نكرر النص بكل مكان
// حالة المريض المسجّل حديثًا من الاستقبال، قبل ما يشوفه الطبيب أو الممرضة ويحددوا تشخيصه
export const conditions = { stable: "مستقرة", followUp: "تحتاج إلى متابعة", critical: "حرجة", pending: "بانتظار التشخيص" };

export const appointmentStatuses = { scheduled: "مجدول", urgent: "عاجل", completed: "مكتمل" };

export const roles = { doctor: "طبيب", nurse: "ممرضة", receptionist: "موظف استقبال" };

// الأدوار السريرية بس: الحالة والتشخيص والقراءات — والاستقبال برا لأن شغله تسجيل ومواعيد
export const clinicalRoles = [roles.doctor, roles.nurse];

export function isClinicalRole(role) {
return clinicalRoles.includes(role);
}

// حالة القراءة بيحسبها النظام من الأرقام، مش جاية من ملف البيانات
// notRecorded لمريض لسا ملفه السريري ناقص (مسجّل من الاستقبال وما انعملّه تشخيص وقراءة بعد)
export const readingStatuses = { normal: "طبيعية", warning: "تحتاج انتباه", critical: "حرجة", notRecorded: "لم تُسجَّل بعد" };

// أي قيمة سريرية ناقصة بتنعرض بهالنص، عربي دايمًا حتى ما تطلع كلمة إنجليزية بالواجهة
export const missingValueLabel = "غير محدد";

// فصائل الدم المسموحة، قائمة ثابتة بدل نص حر حتى ما تنكتب بصيغة غلط
export const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const genderOptions = ["ذكر", "أنثى"];

// حدود بيانات المريض، مكتوبة مرة وحدة عشان يسهل تعديلها
export const patientLimits = { nameMinLength: 3, ageMin: 1, ageMax: 120 };

// رقم الهاتف: أرقام بس، من 7 لـ15 خانة، وبيقبل + بالبداية
export const phonePattern = /^\+?[0-9]{7,15}$/;

// تحقق واحد لبيانات المريض بتستعمله شاشتين: تسجيل مريض جديد بلوحة الاستقبال،
// ولوحة تعديل المريض بصفحة المرضى. الحقول السريرية اختيارية، بس إذا انكتبت لازم تكون سليمة.
export function validatePatientDetails(values, options = {}) {
const { existingPatients = [], ignorePatientId = "" } = options;
const errors = {};

const name = String(values.name ?? "").trim();

if (name.length < patientLimits.nameMinLength) {
errors.name = `اكتب اسم المريض كاملًا (${patientLimits.nameMinLength} أحرف على الأقل).`;
}

const phone = String(values.phone ?? "").trim();

if (!phonePattern.test(phone)) {
errors.phone = "أدخل رقم هاتف صحيح (٧ إلى ١٥ رقمًا).";
} else if (existingPatients.some((patient) => patient.phone === phone && String(patient.id) !== String(ignorePatientId))) {
errors.phone = "رقم الهاتف مسجّل لمريض آخر.";
}

if (!genderOptions.includes(values.gender)) {
errors.gender = "حدد الجنس.";
}

const ageText = String(values.age ?? "").trim();
const age = Number(ageText);

if (!/^\d{1,3}$/.test(ageText) || age < patientLimits.ageMin || age > patientLimits.ageMax) {
errors.age = `أدخل عمرًا صحيحًا بين ${patientLimits.ageMin} و${patientLimits.ageMax}.`;
}

// الحقول السريرية: المريض المسجّل من الاستقبال بيضل بلا تشخيص لحد ما يشوفه الطبيب
const diagnosis = String(values.diagnosis ?? "").trim();

if (diagnosis && diagnosis.length < 3) {
errors.diagnosis = "اكتب التشخيص كاملًا (٣ أحرف على الأقل).";
}

const bloodType = String(values.bloodType ?? "").trim();

if (bloodType && !bloodTypeOptions.includes(bloodType)) {
errors.bloodType = "اختر فصيلة دم من القائمة.";
}

if (values.condition && !Object.values(conditions).includes(values.condition)) {
errors.condition = "حالة المريض غير معروفة.";
}

return { isValid: Object.keys(errors).length === 0, errors };
}

// بترجّع القيمة زي ما هي مع اللاحقة، أو نص «غير محدد» إذا القيمة فاضية — بلا فرض إنها رقم، لأن ضغط الدم نص مثل 120/80
export function formatVitalValue(value, suffix = "") {
if (value === undefined || value === null || value === "") {
return missingValueLabel;
}

return `${value}${suffix}`;
}

// بترجّع نص أي قيمة نصية (تشخيص، فصيلة دم...) أو «غير محدد» إذا كانت فاضية
export function formatTextValue(value) {
return value ? String(value) : missingValueLabel;
}

// بيتأكد إنه في قراءة حيوية كاملة (نبض، ضغط، أكسجين) قبل ما نحسب حالتها
export function hasRecordedVitals(record) {
if (!record) {
return false;
}

const hasHeartRate = record.heartRate !== undefined && record.heartRate !== null && record.heartRate !== "" && Number.isFinite(Number(record.heartRate));
const hasOxygen = record.oxygenLevel !== undefined && record.oxygenLevel !== null && record.oxygenLevel !== "" && Number.isFinite(Number(record.oxygenLevel));
const hasBloodPressure = Boolean(record.bloodPressure);

return hasHeartRate && hasOxygen && hasBloodPressure;
}

// بيتأكد إنه ملف المريض السريري مكتمل: تشخيص وفصيلة دم مسجّلين، مش بس بيانات الاستقبال
export function hasCompleteClinicalProfile(patient) {
return Boolean(patient && patient.diagnosis && patient.bloodType);
}

// أنواع حالة الرعاية، و routine نوع قديم مخلّيينه حتى الحالات المحفوظة من قبل تضل تنقرأ صح
export const notePriorityLabels = { followUp: "متابعة", urgent: "عاجلة", critical: "حرجة", routine: "ملاحظة عامة" };

export function translateNotePriority(priority) {
return notePriorityLabels[priority] || notePriorityLabels.followUp;
}

// ترتيب شدة الحالة، بنقارن فيه بدل ما نقارن نصوص
const conditionSeverity = { [conditions.stable]: 0, [conditions.followUp]: 1, [conditions.critical]: 2 };

// كل نوع حالة رعاية بيقابله تصنيف للمريض
const priorityCondition = { followUp: conditions.followUp, urgent: conditions.followUp, critical: conditions.critical, routine: conditions.followUp };

// بترفع تصنيف المريض إذا الحالة أشد، وما بتخفّضه أبدًا — وبترجّع نص فاضي إذا ما في داعي نغيّر
export function escalateCondition(currentCondition, priority) {
const target = priorityCondition[priority] || conditions.followUp;
const currentLevel = conditionSeverity[currentCondition] ?? 0;
const targetLevel = conditionSeverity[target] ?? 0;

return targetLevel > currentLevel ? target : "";
}

// بنهرّب النص حتى ما ينقرأ كوسوم HTML
export function escapeHtml(value) {
return String(value ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

const arabicLocale = "ar-EG-u-nu-latn";

// تاريخ اليوم بصيغة 2026-08-14، نفس صيغة ملفات البيانات
export function todayIso() {
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

export function formatDate(dateIso) {
if (!dateIso) {
return "";
}

const date = new Date(`${dateIso}T00:00:00`);

if (Number.isNaN(date.getTime())) {
return dateIso;
}

return date.toLocaleDateString(arabicLocale, { day: "numeric", month: "long", year: "numeric" });
}

export function formatWeekday(dateIso) {
if (!dateIso) {
return "";
}

const date = new Date(`${dateIso}T00:00:00`);

if (Number.isNaN(date.getTime())) {
return "";
}

return date.toLocaleDateString(arabicLocale, { weekday: "long" });
}

export function formatDateTime(value) {
if (!value) {
return "";
}

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return String(value);
}

return date.toLocaleString(arabicLocale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

// بنحوّل 13:00 لـ 01:00 م حتى تنقرأ أسرع
export function formatTime(timeValue) {
if (!timeValue) {
return "";
}

const [hours, minutes] = String(timeValue).split(":");
const date = new Date();
date.setHours(Number(hours), Number(minutes), 0, 0);

return date.toLocaleTimeString(arabicLocale, { hour: "2-digit", minute: "2-digit" });
}

export function isToday(dateIso) {
return dateIso === todayIso();
}

// مقارنة التاريخ والوقت: بنحوّل التاريخ والساعة لقيمة وحدة نقدر نقارنها، وعليها بيتقرر إذا الموعد قادم ولا فات
// ---------------------------------------------------------------------------
// كل مقارنات المواعيد بالمشروع بتمر من هون، عشان ما يصير كل شاشة تقارن بطريقتها.

// صيغة التاريخ 2026-08-22 وصيغة الوقت 14:30 — نفس صيغة ملفات البيانات وحقول HTML
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// حقل الوقت ممكن يرجّع "09:00:00"، فبناخد أول خمس خانات بس
export function normalizeTime(timeValue) {
return String(timeValue ?? "").trim().slice(0, 5);
}

// مدة الموعد الافتراضية بالدقائق — منها بنحسب وقت النهاية ونكشف التداخل
export const appointmentDurationMinutes = 30;

// بنبني كائن Date من تاريخ ووقت الموعد.
// النص "2026-08-22T14:30:00" بلا حرف Z بيقراه المتصفح كتوقيت محلي، فما بيصير أي إزاحة timezone.
// كل المقارنات بالمشروع محلية: todayIso() كمان محسوب من التوقيت المحلي للجهاز.
export function toDateTime(dateIso, timeValue) {
const date = String(dateIso ?? "").trim();
const time = normalizeTime(timeValue);

if (!datePattern.test(date) || !timePattern.test(time)) {
return null;
}

const value = new Date(`${date}T${time}:00`);

return Number.isNaN(value.getTime()) ? null : value;
}

// اللحظة الحالية مقرّبة لبداية الدقيقة، حتى حجز الدقيقة الحالية يضل مسموح
function currentMinute() {
const now = new Date();

now.setSeconds(0, 0);

return now.getTime();
}

// هل الوقت المطلوب فات؟ الجواب هون واحد للنموذج ولطبقة الحفظ سوا
export function isPastSlot(dateIso, timeValue) {
const start = toDateTime(dateIso, timeValue);

// بيانات ناقصة أو صيغة غلط: بنعتبرها غير صالحة بدل ما نمررها
if (!start) {
return true;
}

return start.getTime() < currentMinute();
}

// أقدم وقت مسموح بتاريخ معيّن: إذا التاريخ هو اليوم فأقدم وقت هو الساعة الحالية،
// وإذا كان تاريخ قادم فما في حد أدنى للوقت. بترجّع الصيغة "HH:MM" اللي بيفهمها حقل الوقت.
export function earliestTimeForDate(dateIso) {
if (dateIso !== todayIso()) {
return "";
}

const now = new Date();

return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// الفترة الزمنية للموعد: من وقت بدايته لحد ما تخلص مدته
function getAppointmentRange(dateIso, timeValue) {
const start = toDateTime(dateIso, timeValue);

if (!start) {
return null;
}

return { start: start.getTime(), end: start.getTime() + appointmentDurationMinutes * 60 * 1000 };
}

// فترتين بيتداخلوا إذا كل وحدة بتبدأ قبل ما تخلص التانية
function rangesOverlap(first, second) {
return first.start < second.end && second.start < first.end;
}

// الموعد القادم = ما انغلق ولسا مدته ما خلصت
export function isUpcomingAppointment(appointment) {
if (appointment.status === appointmentStatuses.completed) {
return false;
}

const range = getAppointmentRange(appointment.date, appointment.time);

// موعد قديم بلا وقت مضبوط: بنرجع لمقارنة التاريخ لحاله بدل ما نخفيه
if (!range) {
return String(appointment.date) >= todayIso();
}

return range.end > Date.now();
}

// الموعد السابق = تاريخه فات، أو انغلق قبل هيك
export function isPastAppointment(appointment) {
return !isUpcomingAppointment(appointment);
}

// ملخّص المواعيد بينحسب هون مرة وحدة وبتستعمله اللوحة وصفحة المواعيد، عشان ما يختلف رقم البطاقة عن الجدول
export function summarizeAppointments(appointments) {
const upcoming = appointments.filter(isUpcomingAppointment);

return {
total: appointments.length,
today: appointments.filter((appointment) => appointment.date === todayIso()).length,
upcoming: upcoming.length,
scheduled: upcoming.filter((appointment) => appointment.status === appointmentStatuses.scheduled).length,
urgent: upcoming.filter((appointment) => appointment.status === appointmentStatuses.urgent).length,
completed: appointments.filter((appointment) => appointment.status === appointmentStatuses.completed).length,
past: appointments.filter(isPastAppointment).length
};
}

// قواعد الموعد: منع الماضي ومنع التعارض
// ---------------------------------------------------------------------------
// هاي الدوال ما بتعرف شي عن الشاشة، بترجّع رسائل بس. بتستعملها:
//   1) نماذج الإدخال لعرض الخطأ تحت الحقل
//   2) طبقة الحفظ (appointment-rules.js) قبل ما تكتب أي شي بالتخزين
// فما بينفع حدا يتجاوز التحقق بتعديل HTML أو بتغيير قيمة الحقل يدويًا.

export const pastDateMessage = "لا يمكن جدولة موعد في تاريخ سابق.";
export const pastTimeMessage = "الوقت المحدد مضى اليوم — اختر وقتًا لاحقًا.";

// وين بتنحط رسالة الماضي؟ إذا اليوم نفسه فات فالمشكلة بالتاريخ، وإذا التاريخ هو اليوم
// بس الساعة مضت فالمشكلة بالوقت. مكتوبة مرة وحدة هون لأنها بتنستعمل بالتحقق قبل الحفظ
// وبالتنبيه المباشر وقت ما المستخدم يختار، فما بتختلف الرسالة بين الشاشة والحفظ.
export function getPastSlotErrors(dateIso, timeValue) {
if (!isPastSlot(dateIso, timeValue)) {
return {};
}

return String(dateIso) < todayIso() ? { date: pastDateMessage } : { time: pastTimeMessage };
}

// رسالة التعارض بتقول للمستخدم ليش انرفض الموعد بالضبط: مع مين ومتى
export function getConflictMessage(conflictingAppointment) {
const patientName = conflictingAppointment.patient ? conflictingAppointment.patient.name : "";
const withPatient = patientName ? ` للمريض ${patientName}` : "";

return `لا يمكن إضافة الموعد لأن هناك موعدًا آخر متعارضًا مع هذا الوقت${withPatient} بتاريخ ${formatDate(conflictingAppointment.date)} الساعة ${formatTime(conflictingAppointment.time)} (مدة كل موعد ${appointmentDurationMinutes} دقيقة).`;
}

// بيدوّر على أول موعد بيتعارض مع الموعد المطلوب، وبيرجّع null إذا الوقت فاضي.
// قاعدة الحجز بالمشروع: نفس المريض ما بيكون عنده موعدين متداخلين،
// ونفس الطبيب ما بيستقبل موعدين بنفس الفترة.
export function findConflictingAppointment(appointments, candidate) {
const candidateRange = getAppointmentRange(candidate.date, candidate.time);

if (!candidateRange) {
return null;
}

return (
appointments.find((appointment) => {
// الموعد نفسه وقت التعديل ما بيتعارض مع حاله
if (candidate.id && appointment.id === candidate.id) {
return false;
}

// الموعد المكتمل زيارة انتهت، فما بيحجز وقت
if (appointment.status === appointmentStatuses.completed) {
return false;
}

const samePatient = String(appointment.patientId) === String(candidate.patientId);
const sameDoctor = String(appointment.doctorId || "") === String(candidate.doctorId || "");

if (!samePatient && !sameDoctor) {
return false;
}

const otherRange = getAppointmentRange(appointment.date, appointment.time);

return otherRange ? rangesOverlap(candidateRange, otherRange) : false;
}) || null
);
}

// التحقق الكامل للموعد: بيرجّع { isValid, errors, conflict }
// errors كائن مفاتيحه أسماء الحقول، فكل شاشة بتعرض الرسالة تحت حقلها.
// keepPastSlot بتنستعمل بحالة وحدة: تعديل بيانات موعد قديم بلا ما نغيّر وقته
// (مثل اعتماده كمكتمل) — الحجز بوقت ماضٍ بيضل ممنوع بكل الحالات.
export function validateAppointment(candidate, existingAppointments = [], options = {}) {
const { knownPatients = null, keepPastSlot = false } = options;
const errors = {};

// 1) المريض لازم يكون مختار وموجود فعلًا بالسجلات
if (!candidate.patientId) {
errors.patientId = "يرجى اختيار المريض.";
} else if (knownPatients && !knownPatients.some((patient) => String(patient.id) === String(candidate.patientId))) {
errors.patientId = "المريض المختار غير موجود في السجلات.";
}

// 2) صيغة التاريخ والوقت: بنتأكد إنه التاريخ والساعة مكتوبين بالشكل الصح قبل ما نفكّر نقارنهم
const date = String(candidate.date ?? "").trim();
const time = normalizeTime(candidate.time);

if (!date) {
errors.date = "يرجى تحديد تاريخ الموعد.";
} else if (!datePattern.test(date)) {
errors.date = "صيغة التاريخ غير صحيحة (YYYY-MM-DD).";
}

if (!time) {
errors.time = "يرجى تحديد وقت الموعد.";
} else if (!timePattern.test(time)) {
errors.time = "صيغة الوقت غير صحيحة (HH:MM).";
}

// 3) منع الماضي — الرسالة بتنحط على الحقل اللي سبّب المشكلة
if (!errors.date && !errors.time && !keepPastSlot) {
Object.assign(errors, getPastSlotErrors(date, time));
}

// 4) سبب الزيارة: لازم يكون مكتوب فعلًا مش حرف أو حرفين، حتى يعرف الفريق ليش الموعد
if (String(candidate.reason ?? "").trim().length < 3) {
errors.reason = "يرجى كتابة سبب الزيارة (٣ أحرف على الأقل).";
}

// 5) حالة الموعد لازم تكون وحدة من الحالات المعروفة
if (!Object.values(appointmentStatuses).includes(candidate.status)) {
errors.status = "حالة الموعد غير معروفة.";
}

// 6) التعارض — بنفحصه بس لما التاريخ والوقت والمريض يكونوا سليمين
let conflict = null;

if (!errors.date && !errors.time && !errors.patientId) {
conflict = findConflictingAppointment(existingAppointments, { ...candidate, date, time });

if (conflict) {
errors.time = getConflictMessage(conflict);
}
}

return { isValid: Object.keys(errors).length === 0, errors, conflict };
}

// ---------------------------------------------------------------------------
// «أحدث المرضى» مش أحدث المسجّلين، إنما آخر المرضى اللي صار على ملفهم إجراء.
//
// ما اخترعنا نظام تتبّع جديد: سجل الإجراءات (activity log) موجود أصلًا بالمشروع
// وبينكتب فيه كل عملية مع createdAt واسم صاحبها. الشي الوحيد اللي زدناه إنه كل
// إجراء صار يحمل patientId صريح، فصرنا نقدر نجمّع الإجراءات حسب المريض.
//
// المريض اللي لسا ما صار عليه أي إجراء بهالمتصفح بناخد له وقت قراءته المرجعية
// (lastReadingAt) من ملف البيانات، حتى القسم ما يطلع فاضي أول ما يفتح النظام.

// بنحوّل أي وقت لرقم للمقارنة. بنحتاجها لأن أوقات سجل الإجراءات بصيغة UTC
// (فيها Z) وأوقات ملف البيانات محلية، فمقارنة النصوص لحالها مش دقيقة.
function toTimestamp(value) {
const time = Date.parse(value);

return Number.isFinite(time) ? time : 0;
}

// بترجّع آخر إجراء لكل مريض: { patientId: { updatedAt, action } }
function getLastActionByPatient(activityLog) {
const latest = new Map();

activityLog.forEach((entry) => {
if (!entry.patientId || !entry.createdAt) {
return;
}

const patientId = String(entry.patientId);
const current = latest.get(patientId);

if (!current || toTimestamp(entry.createdAt) > toTimestamp(current.updatedAt)) {
latest.set(patientId, { updatedAt: entry.createdAt, action: entry.title || "تحديث على الملف" });
}
});

return latest;
}

// بترجّع المرضى مرتّبين من الأحدث تحديثًا للأقدم، ومعهم شو صار ومتى
export function getRecentlyUpdatedPatients(patients, activityLog, limit = 5) {
const lastAction = getLastActionByPatient(activityLog);

return patients
.map((patient) => {
const tracked = lastAction.get(String(patient.id));

if (tracked) {
return { patient, updatedAt: tracked.updatedAt, action: tracked.action };
}

// ما في إجراء مسجّل: بنرجع لوقت القراءة المرجعية إذا كان موجود
return { patient, updatedAt: patient.lastReadingAt || "", action: "قراءة مرجعية في سجل المستشفى" };
})
.filter((item) => item.updatedAt)
.sort((first, second) => toTimestamp(second.updatedAt) - toTimestamp(first.updatedAt))
.slice(0, limit);
}

// هون بنحدد حالة القراءة من النبض والأكسجين والضغط الانقباضي
export function getReadingStatus(record) {
// ملف ناقص (مريض لسا ما انعملّه تسجيل قراءة) لازم يوصف كـ«لم تُسجَّل»، مش «طبيعية» بالغلط
if (!hasRecordedVitals(record)) {
return readingStatuses.notRecorded;
}

const heartRate = Number(record.heartRate);
const oxygenLevel = Number(record.oxygenLevel);
const systolic = Number(String(record.bloodPressure || "").split("/")[0]);

if (heartRate >= 120 || heartRate < 50 || oxygenLevel < 92 || systolic >= 160) {
return readingStatuses.critical;
}

if (heartRate > 100 || heartRate < 60 || oxygenLevel < 95 || systolic >= 140) {
return readingStatuses.warning;
}

return readingStatuses.normal;
}

export function average(numbers) {
const validNumbers = numbers.filter((number) => Number.isFinite(number));

if (!validNumbers.length) {
return 0;
}

const total = validNumbers.reduce((sum, number) => sum + number, 0);

return Math.round(total / validNumbers.length);
}

// أول حرف من أول كلمتين بالاسم، بعد ما نشيل "د."
export function getInitials(name) {
return String(name || "")
.replace(/^(د\.?|dr\.?)\s*/i, "")
.split(" ")
.filter(Boolean)
.slice(0, 2)
.map((part) => part.charAt(0))
.join("");
}

// التحقق من القراءات الحيوية
// ---------------------------------------------------------------------------
// كل حد مكتوب مرة وحدة هون بكائن واضح، وسهل تعديله لاحقًا بلا ما نلاحق الأرقام بالملفات.
// الهدف منع القيم غير المنطقية أو المستحيلة كإدخال — مش إعطاء تشخيص طبي.

// دالة تحقق رقمية مشتركة: بتخدم النبض والأكسجين والانقباضي والانبساطي بنفس المنطق
// بترجّع رسالة الخطأ، أو نص فاضي إذا القيمة سليمة.
export function getNumberFieldError(value, { label, min, max, unit = "" }) {
const text = String(value ?? "").trim();

if (text === "") {
return `يرجى إدخال ${label}.`;
}

// Number("") بترجّع صفر و Number("12abc") بترجّع NaN — فبنتأكد إنه النص كله رقم
if (!/^-?\d+(\.\d+)?$/.test(text)) {
return `${label} لازم يكون رقمًا بلا حروف أو رموز.`;
}

const number = Number(text);

if (!Number.isFinite(number)) {
return `${label} لازم يكون رقمًا صحيحًا.`;
}

if (number < 0) {
return `${label} ما بيقبل قيمة سالبة.`;
}

if (number < min || number > max) {
return `${label} لازم يكون بين ${min} و${max}${unit ? ` ${unit}` : ""}، وإلا القراءة غير واقعية ولازم التأكد من الجهاز.`;
}

return "";
}

// حدود ضغط الدم — مصدر واحد لكل الأرقام، سهل تعديله بلا ما نلاحق قيم داخل الشاشات.
// MIN_SYSTOLIC / MAX_SYSTOLIC / MIN_DIASTOLIC / MAX_DIASTOLIC
export const systolicLimits = { min: 50, max: 260 };
export const diastolicLimits = { min: 30, max: 160 };

// التلميح اللي بيبيّن داخل الحقل وهو فاضي — placeholder مش قيمة محفوظة
export const bloodPressurePlaceholder = "120/80";

// صيغة الضغط: رقمين أو تلاتة، بعدين /، بعدين رقمين أو تلاتة.
// بترفض "120" و"120-80" و"abc/80" و"120/" و"/80" و"120 / 80".
export const bloodPressurePattern = /^\d{2,3}\/\d{2,3}$/;

export const bloodPressureFormatMessage = `يرجى إدخال ضغط الدم بالصيغة الصحيحة، مثال: ${bloodPressurePlaceholder}`;

export function getSystolicError(value) {
return getNumberFieldError(value, { label: "الضغط الانقباضي", min: systolicLimits.min, max: systolicLimits.max, unit: "ملم زئبق" });
}

export function getDiastolicError(value) {
return getNumberFieldError(value, { label: "الضغط الانبساطي", min: diastolicLimits.min, max: diastolicLimits.max, unit: "ملم زئبق" });
}

// شرط الترتيب: الانقباضي لازم يكون أعلى من الانبساطي، وإلا القراءة مقلوبة أو مدخلة غلط
export function getBloodPressureOrderError(systolic, diastolic) {
if (Number(systolic) <= Number(diastolic)) {
return "الضغط الانقباضي لازم يكون أعلى من الانبساطي (مثال: 120 / 80).";
}

return "";
}

// بنجمع الرقمين بصيغة التخزين "120/80" — الصيغة زي ما هي بملفات البيانات
export function combineBloodPressure(systolic, diastolic) {
return `${String(systolic).trim()}/${String(diastolic).trim()}`;
}

// وبنفصلهم لما نعبّي نموذج التعديل بقراءة محفوظة
export function splitBloodPressure(value) {
const [systolic = "", diastolic = ""] = String(value ?? "").trim().split("/");

return { systolic: systolic.trim(), diastolic: diastolic.trim() };
}

// التحقق الكامل لضغط الدم من نص واحد "120/80". أربع خطوات بالترتيب:
//   1) Format   — الصيغة رقم/رقم (Regex Validation)
//   2) Parsing  — بنفصل النص لرقمين
//   3) Ranges   — كل رقم ضمن حدوده المسموحة
//   4) Relation — الانقباضي لازم يكون أعلى من الانبساطي
// بتستعملها الشاشة وطبقة الحفظ سوا، فما في نسختين من القاعدة.
export function getBloodPressureError(value) {
const trimmed = String(value ?? "").trim();

if (trimmed === "") {
return "يرجى إدخال ضغط الدم.";
}

if (!bloodPressurePattern.test(trimmed)) {
return bloodPressureFormatMessage;
}

const { systolic, diastolic } = splitBloodPressure(trimmed);

return getSystolicError(systolic) || getDiastolicError(diastolic) || getBloodPressureOrderError(systolic, diastolic);
}

export function isValidBloodPressure(value) {
return getBloodPressureError(value) === "";
}

// حدود نبض القلب: أي رقم برا هالمدى بينرفض
export const heartRateLimits = { min: 20, max: 220 };

export function getHeartRateError(value) {
return getNumberFieldError(value, { label: "نبض القلب", min: heartRateLimits.min, max: heartRateLimits.max, unit: "نبضة/دقيقة" });
}

export function isValidHeartRate(value) {
return getHeartRateError(value) === "";
}

// حدود مستوى الأكسجين: نسبة مئوية، فما بتنزل تحت الحد الأدنى ولا بتتعدى 100 أبدًا
export const oxygenLimits = { min: 60, max: 100 };

export function getOxygenError(value) {
return getNumberFieldError(value, { label: "مستوى الأكسجين", min: oxygenLimits.min, max: oxygenLimits.max, unit: "%" });
}

export function isValidOxygenLevel(value) {
return getOxygenError(value) === "";
}

// التحقق الكامل للقراءة الحيوية: بيرجّع { isValid, errors } بنفس أسلوب المواعيد
export function validateVitalRecord(record, options = {}) {
const { knownPatients = null } = options;
const errors = {};

if (!record.patientId) {
errors.patientId = "يرجى اختيار المريض.";
} else if (knownPatients && !knownPatients.some((patient) => String(patient.id) === String(record.patientId))) {
errors.patientId = "المريض المختار غير موجود في السجلات.";
}

const heartRateError = getHeartRateError(record.heartRate);
// ضغط الدم حقل واحد، فرسالته وحدة — بس التحقق جواته بيفحص الانقباضي
// والانبساطي كل واحد لحاله وبيفحص العلاقة بينهم
const bloodPressureError = getBloodPressureError(record.bloodPressure);
const oxygenError = getOxygenError(record.oxygenLevel);

if (heartRateError) {
errors.heartRate = heartRateError;
}

if (bloodPressureError) {
errors.bloodPressure = bloodPressureError;
}

if (oxygenError) {
errors.oxygenLevel = oxygenError;
}

return { isValid: Object.keys(errors).length === 0, errors };
}

export function createId(prefix) {
return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
