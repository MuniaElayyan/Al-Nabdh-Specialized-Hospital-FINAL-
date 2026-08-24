// التحكم بوضع العرض (نهاري / ليلي).
//
// كيف بيشتغل بلا أي ملف CSS؟ ملف js/tailwind-theme.js بيقرأ الوضع المحفوظ
// وبيبني منه لوحة ألوان Tailwind كاملة وقت تحميل الصفحة — المقياس المحايد
// بينقلب: slate-50 (الخلفية) بتصير غامقة وslate-900 (النص) بيصير فاتح.
//
// لأن Tailwind بيولّد ستايله مرة وحدة عند التحميل، تبديل الوضع بيحتاج إعادة
// تحميل الصفحة حتى تُبنى اللوحة الجديدة. التبديل نادر، والفائدة إننا خلصنا
// من ملف CSS ومن كتابة dark: على مئات العناصر.

import { getTheme, setTheme } from "./storage.js";
import { icon, renderIcons } from "./ui.js";

// نفس قيمة slate-50 بالوضع الليلي — بنحطها على html حتى ما تلمع الشاشة
// بالأبيض لحظة التحميل قبل ما يجهز Tailwind
const darkPageBackground = "#071510";

function isDark() {
return getTheme() === "dark";
}

// شكل الزر: شمس بالوضع الليلي، وقمر بالنهاري
function paintToggleButtons(dark) {
document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
button.setAttribute("aria-pressed", String(dark));
button.setAttribute("aria-label", dark ? "الوضع النهاري" : "الوضع الليلي");
button.innerHTML = `<span class="animate-scaleIn inline-flex">${icon(dark ? "sun" : "moon")}</span>`;
});

renderIcons();
}

// بنربط أي زر عليه data-theme-toggle، سواء كان مكتوب بالـHTML أو مرسوم من JavaScript
export function initTheme() {
const dark = isDark();

document.documentElement.style.backgroundColor = dark ? darkPageBackground : "";
paintToggleButtons(dark);

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
button.addEventListener("click", () => {
setTheme(isDark() ? "light" : "dark");
// إعادة التحميل تخلي Tailwind يبني اللوحة الجديدة من الإعدادات
window.location.reload();
});
});
}
