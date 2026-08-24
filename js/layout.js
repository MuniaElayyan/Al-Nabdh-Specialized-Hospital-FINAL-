// تشغيل الهيكل المشترك لكل الصفحات الداخلية.
//
// الهيكل نفسه (القائمة الجانبية، الهيدر، جرس التنبيهات) مكتوب كـHTML كامل
// داخل كل صفحة. هذا الملف مسؤول عن الحركة بس: التأكد من دور المستخدم،
// إخفاء الشاشات اللي مش من صلاحيته، تعبئة اسمه، الساعة، والتنبيهات.

import { getUserByRole, getPatients, getAppointmentsWithPatients } from "./api.js";
import {
getRole,
clearRole,
setUserName,
getNotificationsForRole,
getReadAlertIds,
markAlertsRead,
onDataChange
} from "./storage.js";
import { icon, renderIcons } from "./ui.js";
import { initTheme } from "./theme.js";
import { initAnimations } from "./animations.js";
import {
escapeHtml,
formatDate,
formatTime,
formatDateTime,
formatWeekday,
todayIso,
getInitials,
isUpcomingAppointment,
conditions,
appointmentStatuses,
roles,
isClinicalRole
} from "./helpers.js";

// المسمى الوظيفي — بيستعمله سطر «صاحب الإجراء» داخل التنبيهات
const roleTitles = { [roles.doctor]: "طبيب قلب", [roles.nurse]: "ممرضة قسم القلب", [roles.receptionist]: "موظف استقبال" };

// الحرف اللي بيبين بمربع الصورة لما ما يكون في اسم محفوظ
const roleInitials = { [roles.doctor]: "ط", [roles.nurse]: "م", [roles.receptionist]: "س" };

let clockTimer = null;
let currentAlerts = [];
let currentRole = "";

// الصلاحيات داخل الصفحة: بنشيل من الـHTML كل عنصر مكتوب عليه دور مش دور المستخدم، فما بيوصله ولا سطر من محتوى غيره

export function applyRoleVisibility(role, root = document) {
root.querySelectorAll("[data-roles], [data-role-only]").forEach((element) => {
const allowed = element.dataset.roles || element.dataset.roleOnly || "";

// الأدوار مفصولة بفاصلة، لأن «موظف استقبال» نفسه فيه مسافة
if (!allowed.split(",").map((item) => item.trim()).filter(Boolean).includes(role)) {
element.remove();
}
});
}

// الهيدر: بنكتب اسم صاحب الجلسة، وأول حرفين من اسمه بمربع الصورة

function fillHeaderUser(user, role) {
const userName = user ? user.name : "";

document.getElementById("headerUserName").textContent = userName;
document.getElementById("headerAvatar").textContent = getInitials(userName) || roleInitials[role] || "ط";
}

// الأحداث: فتح وسكّر القائمة الجانبية على الهاتف، وزر الخروج اللي بيمسح الجلسة

function bindSidebarEvents() {
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("sidebarBackdrop");

function openSidebar() {
sidebar.classList.remove("translate-x-full");
backdrop.classList.remove("hidden");
}

function closeSidebar() {
sidebar.classList.add("translate-x-full");
backdrop.classList.add("hidden");
}

document.getElementById("openSidebar").addEventListener("click", openSidebar);
document.getElementById("closeSidebar").addEventListener("click", closeSidebar);
backdrop.addEventListener("click", closeSidebar);
}

function bindLogout() {
document.querySelectorAll("[data-logout]").forEach((button) => {
button.addEventListener("click", () => {
clearRole();
window.location.href = "login.html";
});
});
}

// ساعة حية بالهيدر بتتحدث كل ثانية
function startClock() {
const dateElement = document.getElementById("headerDate");
const clockElement = document.getElementById("headerClock");
const today = todayIso();

dateElement.textContent = `${formatWeekday(today)} ${formatDate(today)}`;

function updateClock() {
const now = new Date();
clockElement.textContent = now.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

updateClock();
clockTimer = setInterval(updateClock, 1000);
}

// التنبيهات: بنبنيها من البيانات نفسها — حالات حرجة، مواعيد عاجلة، وكل إجراء عمله زميل — وبنعرضها بلوحة الجرس

function buildAlerts(patients, appointments) {
// حالة المريض بيانات سريرية، فتنبيهاتها بتطلع للطبيب والتمريض بس
const criticalAlerts = (isClinicalRole(currentRole) ? patients : [])
.filter((patient) => patient.condition === conditions.critical)
.map((patient) => ({ id: `critical-${patient.id}`, iconName: "heart-pulse", title: "حالة حرجة", message: `${patient.name} بحاجة إلى متابعة عاجلة.`, link: `patient-details.html?id=${encodeURIComponent(patient.id)}`, time: "" }));

const urgentAlerts = appointments
.filter((appointment) => appointment.status === appointmentStatuses.urgent && isUpcomingAppointment(appointment))
.map((appointment) => ({ id: `urgent-${appointment.id}`, iconName: "calendar-clock", title: "موعد عاجل", message: `${appointment.patient ? appointment.patient.name : "موعد"} — ${formatDate(appointment.date)} الساعة ${formatTime(appointment.time)}.`, link: "appointments.html", time: "" }));

// إجراءات الطاقم: كل إضافة أو تعديل أو حذف بتوصل لهون ومعها اسم صاحبها وسبب العملية
const activityAlerts = getNotificationsForRole(currentRole).map((entry) => ({ id: entry.id, iconName: entry.iconName || "clipboard-list", title: entry.title, message: entry.message, link: entry.link || "", author: entry.createdByName ? `${entry.createdByName} — ${roleTitles[entry.createdByRole] || entry.createdByRole || ""}` : "", reason: entry.reason || "", time: formatDateTime(entry.createdAt) }));

return [...criticalAlerts, ...urgentAlerts, ...activityAlerts];
}

// عنوان اللوحة وزرها مكتوبين بالـHTML، وهاي بتعبّي القائمة اللي جواتها بس
function renderAlertsPanel() {
const list = document.getElementById("alertsList");
const countBadge = document.getElementById("alertsCount");
const readIds = getReadAlertIds(currentRole);
const unreadCount = currentAlerts.filter((alert) => !readIds.includes(alert.id)).length;

countBadge.textContent = String(unreadCount);
countBadge.classList.toggle("hidden", unreadCount === 0);
countBadge.classList.toggle("flex", unreadCount > 0);
countBadge.classList.toggle("animate-pulse", unreadCount > 0);

list.innerHTML = currentAlerts.length
? currentAlerts
.slice(0, 12)
.map((alert) => {
const isUnread = !readIds.includes(alert.id);
// كل روابط التنبيهات بتودي لملف المريض أو المواعيد، وهدول مفتوحين للطبيب والممرضة
const canOpenLink = Boolean(alert.link);
const openTag = canOpenLink ? `<a href="${escapeHtml(alert.link)}" class="block">` : "<div>";
const closeTag = canOpenLink ? "</a>" : "</div>";

return `
${openTag}
<div class="flex gap-3 rounded-xl p-2 transition duration-300 hover:bg-slate-50 ${isUnread ? "bg-teal-50/70" : ""}">
<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">${icon(alert.iconName, "h-4 w-4")}</span>
<div class="min-w-0 flex-1">
<div class="flex items-start justify-between gap-2">
<p class="text-sm font-bold text-slate-900">${escapeHtml(alert.title)}</p>
${isUnread ? '<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true"></span>' : ""}
</div>
<p class="mt-1 text-xs leading-6 text-slate-500">${escapeHtml(alert.message)}</p>
${alert.author ? `<p class="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700">${icon("user-round", "h-3 w-3")}${escapeHtml(alert.author)}</p>` : ""}
${alert.reason ? `<p class="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><span class="font-semibold">السبب:</span>${escapeHtml(alert.reason)}</p>` : ""}
${alert.time ? `<p class="mt-1 text-[11px] text-slate-400">${escapeHtml(alert.time)}</p>` : ""}
</div>
</div>
${closeTag}
`;
})
.join("")
: `<div class="rounded-xl border border-dashed border-slate-200 p-4 text-center">
<p class="text-sm font-semibold text-slate-700">لا توجد تنبيهات</p>
<p class="mt-1 text-xs text-slate-500">ستظهر هنا الحالات الحرجة والمواعيد العاجلة وإجراءات الزملاء.</p>
</div>`;

renderIcons();
}

function bindAlertsEvents() {
const button = document.getElementById("alertsButton");
const panel = document.getElementById("alertsPanel");

button.addEventListener("click", (event) => {
event.stopPropagation();
const isHidden = panel.classList.toggle("hidden");
button.setAttribute("aria-expanded", String(!isHidden));
});

panel.addEventListener("click", (event) => event.stopPropagation());

// الزر مكتوب بالـHTML، فبنربطه مرة وحدة وما بينعاد ربطه مع كل تحديث للقائمة
document.getElementById("markAlertsRead").addEventListener("click", (event) => {
event.stopPropagation();
markAlertsRead(currentRole, currentAlerts.map((alert) => alert.id));
renderAlertsPanel();
});

document.addEventListener("click", () => {
panel.classList.add("hidden");
button.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (event) => {
if (event.key === "Escape") {
panel.classList.add("hidden");
button.setAttribute("aria-expanded", "false");
}
});
}

async function loadAlerts() {
try {
const patients = await getPatients();
const appointments = await getAppointmentsWithPatients();

currentAlerts = buildAlerts(patients, appointments);
} catch (error) {
console.error(error);
currentAlerts = [];
}

renderAlertsPanel();
}

// بننادي عليها بعد أي إضافة أو تعديل حتى يبيّن بالتنبيهات على طول
export async function refreshAlerts() {
await loadAlerts();
}

// التهيئة: أول شي بنتأكد إنه المستخدم مسموح له بهالشاشة، وبعدين بنبيّن الهيكل وبنشغّل الساعة والتنبيهات

export async function initPage(activePage, allowedRoles = [roles.doctor, roles.nurse, roles.receptionist]) {
const role = getRole();
const knownRoles = [roles.doctor, roles.nurse, roles.receptionist];

// مافي جلسة أصلًا؟ على صفحة الدخول — والهيكل بيضل مخفي فما بيشوف شي
if (!knownRoles.includes(role)) {
window.location.replace("login.html");
return null;
}

// في جلسة بس الصفحة مش من صلاحيته؟ بنرجّعه للوحة التحكم مش للدخول
if (!allowedRoles.includes(role)) {
window.location.replace("dashboard.html");
return null;
}

let user = null;

try {
user = await getUserByRole(role);
} catch (error) {
console.error(error);
}

currentRole = role;
setUserName(user ? user.name : "");

// أول شي بنشيل كل اللي مش من صلاحيته، وبعدين بنبيّن الهيكل
applyRoleVisibility(role);
fillHeaderUser(user, role);
document.getElementById("appShell").classList.remove("hidden");

bindSidebarEvents();
bindLogout();
bindAlertsEvents();
initTheme();
initAnimations();
startClock();
renderIcons();
loadAlerts();

// أي إضافة أو تعديل أو حذف — من هالتبويب أو من تبويب زميل — بتحدّث الجرس على طول
onDataChange(() => loadAlerts());

window.addEventListener("beforeunload", () => clearInterval(clockTimer));

return {
user,
role,
isDoctor: role === roles.doctor,
isNurse: role === roles.nurse,
isReceptionist: role === roles.receptionist
};
}
