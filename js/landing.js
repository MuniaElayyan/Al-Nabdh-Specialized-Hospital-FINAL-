// الصفحة التعريفية: بتقرا الخدمات والتقنيات من ملف المستشفى، والكادر من ملف المستخدمين

import { getHospitalInfo, getUsers } from "./api.js";
import { icon, renderIcons, loadingState, errorState, emptyState } from "./ui.js";
import { initTheme } from "./theme.js";
import { initAnimations } from "./animations.js";
import { escapeHtml } from "./helpers.js";

// الخدمات: بنبني كروت أقسام المستشفى من ملف hospital.json

// كرت خدمة وحدة: أيقونتها واسمها ووصفها، وكلها متاحة فما في حالة «قريبًا»
function serviceCard(service) {
return `
<article data-reveal class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg group relative flex flex-col overflow-hidden rounded-2xl border border-teal-200 bg-surface p-6 shadow-sm">
<span class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-teal-400 to-cyan-600" aria-hidden="true"></span>
<div class="flex items-start justify-between gap-3">
<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition duration-300 group-hover:scale-105">
${icon(service.icon, "h-6 w-6")}
</span>
<span class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
<span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
متاحة الآن
</span>
</div>
<h3 class="mt-5 text-lg font-bold text-slate-900">${escapeHtml(service.name)}</h3>
<p class="mt-2 flex-1 text-sm leading-7 text-slate-500">${escapeHtml(service.description)}</p>
<a href="login.html" class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition duration-300 hover:gap-3">
احجز عبر بوابة الطاقم
${icon("arrow-left", "h-4 w-4")}
</a>
</article>
`;
}

// بنرسم كل الخدمات بشبكة وحدة، وإذا الملف فاضي بنعرض رسالة بدل الشبكة
function renderServices(services) {
const grid = document.getElementById("servicesGrid");

if (!services.length) {
grid.innerHTML = emptyState("لا توجد خدمات", "سيتم إضافة الخدمات قريبًا.");
return;
}

grid.innerHTML = `
<div data-stagger class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
${services.map(serviceCard).join("")}
</div>
`;
}

// الكادر الطبي: بنبني كروت الطاقم من ملف المستخدمين نفسه، فأي تعديل على الأسماء بيبيّن بالموقع وبالنظام سوا

// أيقونة بتناسب دور كل عضو، بتبيّن على الصورة
const staffIcons = { "طبيب": "stethoscope", "ممرضة": "heart-pulse", "موظف استقبال": "concierge-bell" };

// كرت عضو من الكادر: صورته واسمه ومسماه ونبذة عن شغله
function staffCard(member) {
return `
<article data-reveal class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg group overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm">
<div class="group relative overflow-hidden h-72 bg-slate-100">
<img src="${escapeHtml(member.image)}" alt="صورة ${escapeHtml(member.name)}" loading="lazy" data-fade class="h-full w-full object-cover object-top">
<span class="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-semibold text-teal-700 backdrop-blur">
${icon(staffIcons[member.role] || "user-round", "h-3.5 w-3.5")}
${escapeHtml(member.role)}
</span>
</div>
<div class="p-5">
<h3 class="text-lg font-bold text-slate-900">${escapeHtml(member.name)}</h3>
<p class="mt-1 text-sm font-semibold text-teal-700">${escapeHtml(member.title)}</p>
<p class="mt-3 text-sm leading-7 text-slate-500">${escapeHtml(member.bio)}</p>
</div>
</article>
`;
}

// بنرسم الكادر التلاتة من نفس ملف المستخدمين اللي بيسجّلوا فيه دخول
function renderStaff(staff) {
const grid = document.getElementById("staffGrid");

if (!staff.length) {
grid.innerHTML = emptyState("لا توجد بيانات", "سيتم عرض الكادر الطبي قريبًا.");
return;
}

grid.innerHTML = `
<div data-stagger class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
${staff.map(staffCard).join("")}
</div>
`;
}

// التقنيات الطبية: كروت الأجهزة والتقنيات، كمان من ملف بيانات المستشفى

function renderTechnology(equipment) {
const grid = document.getElementById("technologyGrid");

if (!equipment.length) {
grid.innerHTML = emptyState("لا توجد بيانات", "سيتم عرض التقنيات الطبية قريبًا.");
return;
}

grid.innerHTML = `
<div data-stagger class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
${equipment
.map(
(item) => `
<article data-reveal class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
${icon(item.icon, "h-6 w-6")}
</span>
<h3 class="mt-5 text-base font-bold text-slate-900">${escapeHtml(item.name)}</h3>
<p class="mt-2 text-sm leading-7 text-slate-500">${escapeHtml(item.description)}</p>
</article>`
)
.join("")}
</div>
`;
}

// قائمة الهاتف: زر واحد بيفتح وبيسكّر روابط الصفحة على الشاشة الصغيرة، وأي ضغطة على رابط بتسكّرها

// الشريط العلوي ما كان فيه أي تنقّل على الشاشات الصغيرة، فأضفنا زر بيفتح ويسكّر القائمة
function setupMobileMenu() {
const button = document.getElementById("openMenu");
const menu = document.getElementById("mobileMenu");

function setOpen(open) {
menu.classList.toggle("hidden", !open);
menu.classList.toggle("animate-slideDown", open);
button.setAttribute("aria-expanded", String(open));
}

button.addEventListener("click", () => setOpen(menu.classList.contains("hidden")));

// الضغط على أي رابط بينزّل على القسم وبيسكّر القائمة
menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
}

// الجولة: بنبدّل صورة الغلاف بمشغّل الفيديو، وإذا الملف مش موجود بنرجّع الغلاف مع رسالة

function setupTour() {
const poster = document.getElementById("tourPoster");
const video = document.getElementById("tourVideo");
const message = document.getElementById("tourMessage");

function showFallback() {
video.classList.add("hidden");
poster.classList.remove("hidden");
message.classList.remove("hidden");
}

document.getElementById("playTour").addEventListener("click", () => {
poster.classList.add("hidden");
video.classList.remove("hidden");
video.play().catch(showFallback);
});

// خطأ التحميل بيصير على عنصر source مش على video
video.querySelector("source").addEventListener("error", showFallback);
video.addEventListener("error", showFallback);
}

// التشغيل: بنجيب بيانات المستشفى وبنرسم الأقسام التلاتة، وإذا فشل التحميل بنعرض رسالة مع زر إعادة محاولة

async function loadHospitalInfo() {
const grids = ["servicesGrid", "staffGrid", "technologyGrid"];

grids.forEach((gridId) => {
document.getElementById(gridId).innerHTML = loadingState("جاري تحميل بيانات المستشفى...");
});

try {
const hospital = await getHospitalInfo();
// الكادر جاي من ملف المستخدمين نفسه، فأي تعديل على الأسماء بيبيّن بالموقع وبالنظام سوا
const staff = await getUsers();

renderServices(hospital.services || []);
renderStaff(staff || []);
renderTechnology(hospital.equipment || []);
} catch (error) {
console.error(error);

grids.forEach((gridId) => {
document.getElementById(gridId).innerHTML = errorState("تعذر تحميل بيانات المستشفى. يرجى المحاولة مرة أخرى.");
});

document.getElementById("servicesGrid").innerHTML = errorState("تعذر تحميل بيانات المستشفى. يرجى المحاولة مرة أخرى.", "retryHospital");
document.getElementById("retryHospital").addEventListener("click", loadHospitalInfo);
} finally {
renderIcons();
}
}

initTheme();
initAnimations();
setupMobileMenu();
setupTour();
loadHospitalInfo();
renderIcons();
