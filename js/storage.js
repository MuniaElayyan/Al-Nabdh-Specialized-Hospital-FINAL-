// ملفات البيانات للقراءة بس، فكل شي بيضيفه الطبيب (مواعيد، قراءات، ملاحظات) بينحفظ بالمتصفح

import {
createId,
roles,
toDateTime,
isPastSlot,
normalizeTime,
pastDateMessage,
getBloodPressureError,
getHeartRateError,
getOxygenError
} from "./helpers.js";

const storageKeys = { role: "cardiac.role", userName: "cardiac.userName", patients: "cardiac.patients", patientUpdates: "cardiac.patientUpdates", appointments: "cardiac.appointments", vitals: "cardiac.vitals", notes: "cardiac.notes", statusOverrides: "cardiac.statusOverrides", activity: "cardiac.activity", readAlerts: "cardiac.readAlerts", preferences: "cardiac.preferences", theme: "cardiac.theme" };

// بنقرا المصفوفة المحفوظة، وإذا كانت خربانة بنرجّع وحدة فاضية
function readList(key) {
try {
const rawValue = localStorage.getItem(key);
const parsed = rawValue ? JSON.parse(rawValue) : [];

return Array.isArray(parsed) ? parsed : [];
} catch (error) {
console.error(error);
return [];
}
}

function writeList(key, list) {
localStorage.setItem(key, JSON.stringify(list));
announceChange(key);
}

// إشارة التغيير: أي حفظ بيطلق إشارة بتوصل لكل الشاشات المفتوحة — بنفس التبويب وبتبويب الزميل — فبتتحدث أرقامها لحالها

// المفاتيح اللي لما تتغير بيصير في داتا جديدة لازم كل الشاشات تعيد رسم أرقامها
const liveDataKeys = [
storageKeys.patients,
storageKeys.patientUpdates,
storageKeys.appointments,
storageKeys.vitals,
storageKeys.notes,
storageKeys.statusOverrides,
storageKeys.activity
];

export const dataChangedEvent = "cardiac:data-changed";

// بنأجّل الإشارة لما يخلص الكود اللي عم بيحفظ، حتى ما ينعاد الرسم وهو لسا بنص شغله
function announceChange(key) {
if (!liveDataKeys.includes(key)) {
return;
}

setTimeout(() => window.dispatchEvent(new CustomEvent(dataChangedEvent, { detail: { key } })), 0);
}

// أي شاشة بتنادي عليها مرة وحدة، وبتوصلها الإشارة من نفس التبويب ومن تبويب الزميل كمان
export function onDataChange(handler) {
window.addEventListener(dataChangedEvent, handler);

window.addEventListener("storage", (event) => {
if (event.key && liveDataKeys.includes(event.key)) {
handler(event);
}
});
}

// جلسة المستخدم: بنحفظ دوره واسمه بالمتصفح، وعليهم بتتقرر صلاحياته وبينكتب اسمه على كل إجراء بيعمله

export function getRole() {
return localStorage.getItem(storageKeys.role) || "";
}

export function setRole(role) {
localStorage.setItem(storageKeys.role, role);
}

export function clearRole() {
localStorage.removeItem(storageKeys.role);
localStorage.removeItem(storageKeys.userName);
}

// اسم صاحب الجلسة بينحفظ عشان أي إجراء ينحطّ عليه اسم صاحبه بدون ما نمرّره من كل صفحة
export function getUserName() {
return localStorage.getItem(storageKeys.userName) || "";
}

export function setUserName(name) {
localStorage.setItem(storageKeys.userName, name || "");
}

// المرضى الجدد بينحفظوا محليًا لأن ملفات JSON الأصلية للقراءة فقط
export function getSavedPatients() {
return readList(storageKeys.patients);
}

export function savePatient(patient) {
const patients = getSavedPatients();
const nextPatient = { id: createId("patient"), ...patient };

writeList(storageKeys.patients, [...patients, nextPatient]);

return nextPatient;
}

export function getPatientUpdates() {
try {
const rawValue = localStorage.getItem(storageKeys.patientUpdates);
const parsed = rawValue ? JSON.parse(rawValue) : {};

return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
} catch (error) {
console.error(error);
return {};
}
}

export function updatePatient(patientId, changes) {
const currentUpdates = getPatientUpdates();
const updates = { ...currentUpdates, [patientId]: { ...(currentUpdates[patientId] || {}), ...changes } };

localStorage.setItem(storageKeys.patientUpdates, JSON.stringify(updates));
announceChange(storageKeys.patientUpdates);
}

// المواعيد: حفظ وتعديل وحذف، وقبل أي كتابة بنتأكد إنه الوقت صالح ومش ماضي — وهاد آخر خط دفاع حتى لو انتودت الدالة من console المتصفح

export function getSavedAppointments() {
return readList(storageKeys.appointments);
}

// خط الدفاع الأخير قبل الكتابة بالتخزين.
// حتى لو حدا عدّل الـHTML أو نادى الدالة من console المتصفح، الموعد المشوّه
// أو اللي وقته فات ما بينحفظ — بترمي خطأ وبتوقف العملية.
function assertBookableSlot(date, time) {
if (!toDateTime(date, time)) {
throw new Error("بيانات الموعد غير صالحة: تأكد من التاريخ والوقت.");
}

if (isPastSlot(date, time)) {
throw new Error(pastDateMessage);
}
}

export function saveAppointment(appointment) {
assertBookableSlot(appointment.date, appointment.time);

const appointments = getSavedAppointments();
const nextAppointment = { id: createId("appointment"), ...appointment, time: normalizeTime(appointment.time) };

writeList(storageKeys.appointments, [...appointments, nextAppointment]);

return nextAppointment;
}

export function updateAppointment(appointmentId, changes) {
const savedAppointments = getSavedAppointments();
const current = savedAppointments.find((appointment) => appointment.id === appointmentId);

if (!current) {
throw new Error("الموعد المطلوب تعديله غير موجود.");
}

const nextDate = changes.date ?? current.date;
const nextTime = normalizeTime(changes.time ?? current.time);
// تغيير الوقت لازم يكون لوقت قادم. أما تعديل بيانات موعد قديم بلا ما نلمس وقته
// (مثل اعتماده «مكتمل») فبيضل مسموح — لأنه ما في حجز جديد بالماضي.
const keepsSameSlot = nextDate === current.date && nextTime === normalizeTime(current.time);

if (!keepsSameSlot) {
assertBookableSlot(nextDate, nextTime);
}

const appointments = savedAppointments.map((appointment) => appointment.id === appointmentId ? { ...appointment, ...changes, date: nextDate, time: nextTime } : appointment);

writeList(storageKeys.appointments, appointments);
}

export function deleteAppointment(appointmentId) {
const appointments = getSavedAppointments().filter((appointment) => appointment.id !== appointmentId);

writeList(storageKeys.appointments, appointments);
}

// القراءات الحيوية: نفس فكرة حماية المواعيد — قراءة بقيم مستحيلة ما بتوصل للتخزين أبدًا

export function getSavedVitals() {
return readList(storageKeys.vitals);
}

// نفس فكرة حماية المواعيد: قراءة حيوية بقيم مستحيلة ما بتوصل للتخزين أبدًا
function assertValidVitalValues({ heartRate, bloodPressure, oxygenLevel }) {
const error = getHeartRateError(heartRate) || getBloodPressureError(bloodPressure) || getOxygenError(oxygenLevel);

if (error) {
throw new Error(error);
}
}

export function saveVital(record) {
assertValidVitalValues(record);

const vitals = getSavedVitals();
const nextRecord = { id: createId("vital"), recordedAt: new Date().toISOString(), ...record };

writeList(storageKeys.vitals, [...vitals, nextRecord]);

return nextRecord;
}

// بنعدّل القراءة وبنسجّل وقت التعديل، والقراءة المرجعية ما بتوصل لهون لأنها مش محفوظة عنا
export function updateVital(recordId, changes) {
const savedVitals = getSavedVitals();
const current = savedVitals.find((record) => record.id === recordId);

if (!current) {
throw new Error("القراءة المطلوب تعديلها غير موجودة.");
}

assertValidVitalValues({ ...current, ...changes });

const vitals = savedVitals.map((record) => record.id === recordId ? { ...record, ...changes, updatedAt: new Date().toISOString() } : record);

writeList(storageKeys.vitals, vitals);
}

export function deleteVital(recordId) {
const vitals = getSavedVitals().filter((record) => record.id !== recordId);

writeList(storageKeys.vitals, vitals);
}

// الملاحظات: بتنحفظ مع وقت كتابتها ووقت آخر تعديل عليها، ومرتّبة من الأحدث للأقدم

export function getSavedNotes() {
return readList(storageKeys.notes);
}

export function getPatientNotes(patientId) {
return getSavedNotes()
.filter((note) => note.patientId === patientId)
.sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
}

export function saveNote(note) {
const notes = getSavedNotes();
const nextNote = { id: createId("note"), createdAt: new Date().toISOString(), ...note };

writeList(storageKeys.notes, [nextNote, ...notes]);

return nextNote;
}

// بنحتفظ بوقت الإنشاء وبنضيف وقت تعديل، عشان يبين بالواجهة إنه الملاحظة انعدّلت
export function updateNote(noteId, changes) {
const notes = getSavedNotes().map((note) => note.id === noteId ? { ...note, ...changes, updatedAt: new Date().toISOString() } : note);

writeList(storageKeys.notes, notes);
}

export function deleteNote(noteId) {
const notes = getSavedNotes().filter((note) => note.id !== noteId);

writeList(storageKeys.notes, notes);
}

// تحديث حالة المريض: الحالة الجديدة بتنحفظ بمفتاح لحاله، وapi.js بيركّبها فوق بيانات المريض الأصلية وقت القراءة

// بنحفظ الحالة الجديدة بكائن مفاتيحه أرقام المرضى: { "3": "مستقرة" }
export function getStatusOverrides() {
try {
const rawValue = localStorage.getItem(storageKeys.statusOverrides);
const parsed = rawValue ? JSON.parse(rawValue) : {};

return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
} catch (error) {
console.error(error);
return {};
}
}

export function saveStatusOverride(patientId, condition) {
const overrides = { ...getStatusOverrides(), [patientId]: condition };

localStorage.setItem(storageKeys.statusOverrides, JSON.stringify(overrides));
announceChange(storageKeys.statusOverrides);
}

// سجل الإجراءات والإشعارات

const notifiedRoles = [roles.doctor, roles.nurse, roles.receptionist];

// سجل مختصر لآخر العمليات، بيطلع بقائمة التنبيهات بالهيدر
export function getActivityLog() {
return readList(storageKeys.activity);
}

// أي إضافة أو تعديل أو حذف بينحفظ هون ومعه اسم صاحبه ودوره وسببه، وبيوصل إشعاره للتلاتة كلهم
export function addActivity(entry) {
const activity = getActivityLog();

const nextEntry = { id: createId("activity"), createdAt: new Date().toISOString(), createdByRole: getRole(), createdByName: getUserName(), recipientRoles: notifiedRoles, reason: "", ...entry };

writeList(storageKeys.activity, [nextEntry, ...activity].slice(0, 40));

return nextEntry;
}

// الإشعارات اللي تخص دور معيّن — والسجلات القديمة بلا عناوين بتضل تبيّن للكل
export function getNotificationsForRole(role) {
return getActivityLog().filter((entry) => Array.isArray(entry.recipientRoles) ? entry.recipientRoles.includes(role) : true);
}

// التنبيهات المقروءة والتفضيلات

// كل دور إله قائمة مقروءاته لحاله، عشان قراءة الطبيب ما تخفي الإشعار عن التمريض
function readAlertsKey(role) {
return `${storageKeys.readAlerts}.${role}`;
}

export function getReadAlertIds(role) {
return readList(readAlertsKey(role));
}

export function markAlertsRead(role, alertIds) {
const currentIds = getReadAlertIds(role);
const mergedIds = [...new Set([...currentIds, ...alertIds])];

writeList(readAlertsKey(role), mergedIds.slice(-120));
}

export function getPreferences() {
try {
const rawValue = localStorage.getItem(storageKeys.preferences);

return rawValue ? JSON.parse(rawValue) : {};
} catch (error) {
console.error(error);
return {};
}
}

export function savePreference(key, value) {
const preferences = { ...getPreferences(), [key]: value };

localStorage.setItem(storageKeys.preferences, JSON.stringify(preferences));
}

// وضع العرض: بنخزنه لحاله بمفتاح بسيط لأن سكربت الـ head بيقرأه قبل ما يبدأ الرسم
export function getTheme() {
return localStorage.getItem(storageKeys.theme) === "dark" ? "dark" : "light";
}

export function setTheme(theme) {
localStorage.setItem(storageKeys.theme, theme);
}
