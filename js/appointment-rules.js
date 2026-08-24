// طبقة قواعد المواعيد — الطريق الوحيد المسموح لإنشاء أو تعديل موعد بالمشروع.
//
// ليش موجودة؟ لأن إنشاء الموعد بيصير من مكانين: صفحة المواعيد، ونموذج تسجيل
// مريض جديد بلوحة الاستقبال. لو حطينا التحقق بكل شاشة لحالها بيصير في نسختين
// من القواعد وبيختلفوا مع الوقت — وهاي بالضبط الثغرة اللي كانت تمرّر موعد سابق.
//
// ترتيب طبقات الحماية بالمشروع:
//   1) خصائص min بحقول HTML          → إرشاد للمستخدم بس
//   2) validateAppointment بالنموذج    → رسالة واضحة تحت كل حقل
//   3) هالملف قبل الحفظ                → تحقق من بيانات حيّة (كل المواعيد الحالية)
//   4) storage.js عند الكتابة          → رفض نهائي حتى لو انتُودي من الـconsole

import { getPatients, getAppointmentsWithPatients } from "./api.js";
import { saveAppointment, updateAppointment } from "./storage.js";
import { validateAppointment, normalizeTime, appointmentStatuses } from "./helpers.js";

// خطأ مفهوم للواجهة: فيه رسالة عامة + رسائل الحقول عشان النموذج يعرضها تحت حقولها
export class AppointmentRuleError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "AppointmentRuleError";
    this.fieldErrors = fieldErrors;
  }
}

// بنقرأ الحقول المسموحة بس، فما بينحفظ أي شي زيادة إجا من نموذج معدّل
function toStoredAppointment(values) {
  return {
    patientId: String(values.patientId),
    doctorId: String(values.doctorId || "1"),
    date: String(values.date).trim(),
    time: normalizeTime(values.time),
    status: values.status || appointmentStatuses.scheduled,
    reason: String(values.reason || "").trim()
  };
}

// بنجيب أحدث نسخة من المرضى والمواعيد لحظة الحفظ بالذات — مش نسخة قديمة بالذاكرة —
// حتى موعد أضافه زميل من تبويب تاني ينحسب بفحص التعارض.
async function loadLiveData() {
  const [patients, appointments] = await Promise.all([getPatients(), getAppointmentsWithPatients()]);

  return { patients, appointments };
}

// فحص بلا حفظ: بتستعمله النماذج لتبيين الأخطاء وقت الكتابة
export async function checkAppointment(values, options = {}) {
  const { patients, appointments } = await loadLiveData();

  return validateAppointment(toStoredAppointment(values), appointments, { knownPatients: patients, ...options });
}

// إنشاء موعد جديد — بيرمي AppointmentRuleError إذا انكسرت أي قاعدة
export async function createAppointment(values) {
  const appointment = toStoredAppointment(values);
  const { patients, appointments } = await loadLiveData();
  const result = validateAppointment(appointment, appointments, { knownPatients: patients });

  if (!result.isValid) {
    throw new AppointmentRuleError(Object.values(result.errors)[0], result.errors);
  }

  return saveAppointment(appointment);
}

// تعديل موعد محفوظ — نفس القواعد، مع سماح واحد: تعديل بيانات موعد قديم
// بلا ما نغيّر وقته (مثل اعتماده «مكتمل»). الحجز بوقت ماضٍ بيضل ممنوع.
export async function saveAppointmentEdit(appointmentId, values) {
  const appointment = toStoredAppointment(values);
  const { patients, appointments } = await loadLiveData();
  const current = appointments.find((item) => item.id === appointmentId);

  if (!current) {
    throw new AppointmentRuleError("الموعد المطلوب تعديله غير موجود.");
  }

  if (!current.isSaved) {
    throw new AppointmentRuleError("هذا الموعد جزء من سجل المستشفى الثابت ولا يمكن تعديله.");
  }

  const keepPastSlot = appointment.date === current.date && appointment.time === normalizeTime(current.time);
  const result = validateAppointment({ ...appointment, id: appointmentId }, appointments, { knownPatients: patients, keepPastSlot });

  if (!result.isValid) {
    throw new AppointmentRuleError(Object.values(result.errors)[0], result.errors);
  }

  updateAppointment(appointmentId, appointment);

  return { ...current, ...appointment };
}
