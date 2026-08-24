// بوابة دخول الطاقم: شاشة وحدة فيها خطوتين — الدخول، بعدين نوع العضو وبيفوت على اللوحة

import { setRole } from "./storage.js";
import { renderIcons } from "./ui.js";
import { initTheme } from "./theme.js";
import { initAnimations } from "./animations.js";
import { roles } from "./helpers.js";

const steps = ["access", "staff"];

// الأدوار التلاتة كلها إلها بوابة شغالة، وكل واحد بيوصل للوحته حسب صلاحياته
const openStaffRoles = { doctor: roles.doctor, nurse: roles.nurse, receptionist: roles.receptionist };

// بنعرض خطوة وحدة وبنخفي الباقي، وبنحدّث مؤشر التقدم فوق
function showStep(activeStep) {
steps.forEach((step) => {
const panel = document.querySelector(`[data-step="${step}"]`);
panel.classList.toggle("hidden", step !== activeStep);
});

const activeIndex = steps.indexOf(activeStep);

steps.forEach((step, index) => {
const dot = document.querySelector(`[data-step-dot="${step}"]`);
dot.classList.toggle("bg-brand", index <= activeIndex);
dot.classList.toggle("bg-slate-200", index > activeIndex);
});

window.scrollTo({ top: 0, behavior: "smooth" });
}

// بنحفظ الدور زي ما هو بملف المستخدمين، والتلاتة بيروحوا لنفس اللوحة والمحتوى بيتغير حسب الدور
function openStaffPortal(staffType) {
setRole(openStaffRoles[staffType] || roles.doctor);
window.location.href = "dashboard.html";
}

// الأحداث: زر البدء بينقل للخطوة التانية، وأزرار الرجوع بترجّع، واختيار نوع العضو بيحفظ الدور وبيفوت على اللوحة

document.getElementById("startAccess").addEventListener("click", () => showStep("staff"));

document.querySelectorAll("[data-back]").forEach((button) => {
button.addEventListener("click", () => showStep(button.dataset.back));
});

// اختيار نوع العضو هو آخر خطوة، فبينحفظ الدور وبيفوت على اللوحة على طول
document.querySelectorAll("[data-staff]").forEach((button) => {
button.addEventListener("click", () => openStaffPortal(button.dataset.staff));
});

initTheme();
initAnimations();
renderIcons();
