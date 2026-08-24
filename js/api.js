// كل قراءة لملفات البيانات بتمر من هون، وباقي الملفات مسؤولة عن العرض بس

import { getPatientUpdates, getSavedAppointments, getSavedPatients, getSavedVitals, getStatusOverrides } from "./storage.js";
import { isUpcomingAppointment } from "./helpers.js";

// ملفات البيانات صاروا بفولدر data، والمسار محسوب من صفحة HTML اللي بالجذر
const dataFolder = "./data/";

// بنخزن الملف بعد أول قراءة ناجحة حتى ما نعيد الطلب بنفس الصفحة
const loadedFiles = new Map();

async function fetchJson(fileName, errorMessage, expectArray = true) {
if (loadedFiles.has(fileName)) {
return loadedFiles.get(fileName);
}

try {
const response = await fetch(dataFolder + fileName);

if (!response.ok) {
throw new Error(`${errorMessage} (${response.status})`);
}

const data = await response.json();

if (expectArray && !Array.isArray(data)) {
throw new Error(`${errorMessage}: unexpected format`);
}

loadedFiles.set(fileName, data);

return data;
} catch (error) {
console.error(error);
throw new Error(errorMessage);
}
}

// بنجيب المرضى من الملف وبنطبق عليهم أي حالة عدّلها الطبيب، بنسخة جديدة حتى ما نلمس الأصل
export async function getPatients() {
const basePatients = await fetchJson("patients.json", "تعذر تحميل بيانات المرضى. يرجى المحاولة مرة أخرى.");
const patients = [...basePatients, ...getSavedPatients()];
const statusOverrides = getStatusOverrides();
const patientUpdates = getPatientUpdates();

return patients.map((patient) => ({ ...patient, ...(patientUpdates[patient.id] || {}), ...(statusOverrides[patient.id] ? { condition: statusOverrides[patient.id] } : {}) }));
}

export async function getAppointments() {
return fetchJson("appointments.json", "تعذر تحميل بيانات المواعيد. يرجى المحاولة مرة أخرى.");
}

export async function getUsers() {
return fetchJson("users.json", "تعذر تحميل بيانات الحساب. يرجى المحاولة مرة أخرى.");
}

// محتوى الصفحة التعريفية: الأقسام والأطباء والتقنيات
export async function getHospitalInfo() {
return fetchJson("hospital.json", "تعذر تحميل بيانات المستشفى. يرجى المحاولة مرة أخرى.", false);
}

// بنجيب صاحب الجلسة حسب دوره: طبيب أو ممرضة
export async function getUserByRole(role) {
const users = await getUsers();

return users.find((user) => user.role === role) || null;
}

function byDateThenTime(first, second) {
return `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`);
}

// هون بندمج مواعيد الملف مع اللي أضافها الطبيب، وبنربط كل موعد بمريضه
export async function getAppointmentsWithPatients() {
const patients = await getPatients();
const baseAppointments = await getAppointments();

const savedAppointments = getSavedAppointments().map((appointment) => ({ ...appointment, isSaved: true }));
const allAppointments = [
...baseAppointments.map((appointment) => ({ ...appointment, isSaved: false })),
...savedAppointments
];

return allAppointments
.map((appointment) => ({ ...appointment, patient: patients.find((patient) => patient.id === appointment.patientId) || null }))
.sort(byDateThenTime);
}

// سجل القراءات: قراءة مرجعية لكل مريض من الملف، وفوقها اللي سجّله الطبيب بالمتابعة
export async function getVitalRecords() {
const patients = await getPatients();

const baseRecords = patients.filter((patient) => patient.heartRate && patient.bloodPressure && patient.oxygenLevel).map((patient) => ({
id: `base-${patient.id}`,
patientId: patient.id,
patientName: patient.name,
heartRate: patient.heartRate,
bloodPressure: patient.bloodPressure,
oxygenLevel: patient.oxygenLevel,
condition: patient.condition,
// وقت القراءة المرجعية جاي من ملف المرضى، فكل قراءة بالسجل إلها تاريخ حقيقي
recordedAt: patient.lastReadingAt || "",
isSaved: false
}));

const savedRecords = getSavedVitals().map((record) => {
const patient = patients.find((item) => item.id === record.patientId);

return {
...record,
patientName: patient ? patient.name : "",
condition: patient ? patient.condition : "",
isSaved: true
};
});

// كل السجل مرتّب بالوقت من الأحدث للأقدم، القراءة المرجعية وقراءات المتابعة سوا
return [...savedRecords, ...baseRecords].sort((first, second) => String(second.recordedAt).localeCompare(String(first.recordedAt)));
}

// بترجّع الموعد اللي بيبيّن بكرت المريض: القادم إذا في، وإلا آخر موعد سابق حتى ما يقول «لا يوجد موعد» وهو إله مواعيد
export function findPatientAppointment(appointments, patientId) {
// القائمة واصلتنا مرتّبة بالتاريخ والوقت، فأول قادم هو الأقرب وآخر سابق هو الأحدث
const patientAppointments = appointments.filter((appointment) => appointment.patientId === patientId);
const upcoming = patientAppointments.find(isUpcomingAppointment);

if (upcoming) {
return { appointment: upcoming, isUpcoming: true };
}

const past = patientAppointments.filter((appointment) => !isUpcomingAppointment(appointment)).pop() || null;

return { appointment: past, isUpcoming: false };
}
