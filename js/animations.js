// الحركات المشتركة — بلا أي ملف CSS.
// كل شي هون إما كلاسات Tailwind بنبدّلها من JavaScript، أو خصائص inline بنكتبها مباشرة.
// الحركات نفسها (animate-fadeUp وإخوتها) معرّفة بإعدادات Tailwind في js/tailwind-theme.js

// المستخدم اللي مفعّل «تقليل الحركة» بجهازه بناخد كل الحركات عنه
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// جهاز بلا ماوس (هاتف/تابلت) ما بيستفيد من حركات المرور، فبنوقفها ونوفّر أداء
const hasPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// الكلاسات اللي بتخفي العنصر قبل ظهوره، وبتبدّلها الحركة لما يوصل الشاشة
const hiddenClasses = { up: ["opacity-0", "translate-y-6"], right: ["opacity-0", "translate-x-4"], left: ["opacity-0", "-translate-x-4"], zoom: ["opacity-0", "scale-95"] };
const shownClasses = ["opacity-100", "translate-y-0", "translate-x-0", "scale-100"];

// 1) الظهور عند التمرير: بنراقب كل عنصر عليه data-reveal، وأول ما يوصل الشاشة بنشيل عنه كلاسات الإخفاء فبيدخل بحركة ناعمة، وبعدها بنبطّل نراقبه
// ------------------------------------------------------------------

let revealObserver = null;

function getRevealObserver() {
if (revealObserver) {
return revealObserver;
}

revealObserver = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
if (!entry.isIntersecting) {
return;
}

show(entry.target);
revealObserver.unobserve(entry.target);
});
},
// بنبدأ الحركة والعنصر لسا داخل من تحت الشاشة، حتى يوصل ظاهر خلصان
{ threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);

return revealObserver;
}

function show(element) {
const variant = element.dataset.reveal || "up";

element.classList.remove(...(hiddenClasses[variant] || hiddenClasses.up));
element.classList.add(...shownClasses);
}

// بنراقب أي عنصر جديد عليه data-reveal، والعناصر المراقَبة من قبل بنتجاهلها
function observeReveals(root = document) {
root.querySelectorAll("[data-reveal]").forEach((element) => {
if (element.dataset.revealBound === "true") {
return;
}

element.dataset.revealBound = "true";

// إعداد تقليل الحركة: بنعرض العنصر على طول بلا أي انتقال
if (prefersReducedMotion) {
show(element);
return;
}

const variant = element.dataset.reveal || "up";

element.classList.add("transition-all", "duration-700", "ease-out", ...(hiddenClasses[variant] || hiddenClasses.up));
getRevealObserver().observe(element);
});
}

// 2) الظهور المتدرّج: أبناء أي عنصر عليه data-stagger بيدخلوا ورا بعض، والتأخير بينكتب inline لأن Tailwind ما بيقدر يعطي كل ابن تأخير مختلف
// ------------------------------------------------------------------

// أبناء العنصر بيدخلوا ورا بعض. التأخير بينكتب كخاصية inline من JavaScript،
// لأن Tailwind ما بيقدر يعطي كل ابن تأخيرًا مختلفًا بلا CSS.
function applyStagger(root = document) {
if (prefersReducedMotion) {
return;
}

root.querySelectorAll("[data-stagger]").forEach((parent) => {
if (parent.dataset.staggerBound === "true") {
return;
}

parent.dataset.staggerBound = "true";

[...parent.children].forEach((child, index) => {
child.classList.add("animate-fadeUp");
child.style.animationDelay = `${Math.min(index, 8) * 55 + 40}ms`;
});
});
}

// 3) ظهور الصور: أي صورة عليها data-fade بتبين بتلاشٍ خفيف بعد ما تخلص تحميل، وحتى لو فشل تحميلها بتبين عشان ما يضل مكانها فاضي
// ------------------------------------------------------------------

// الصورة بتدخل بتلاشٍ خفيف بعد ما تخلص تحميل، وإذا كانت محمّلة أصلًا بتبين على طول
function revealImages(root = document) {
root.querySelectorAll("img[data-fade]").forEach((image) => {
if (image.dataset.fadeBound === "true") {
return;
}

image.dataset.fadeBound = "true";
image.classList.add("transition-opacity", "duration-700");

const reveal = () => image.classList.replace("opacity-0", "opacity-100");

if (image.complete) {
reveal();
return;
}

image.classList.add("opacity-0");
image.addEventListener("load", reveal, { once: true });
// الصورة اللي ما زبطت لازم تبين كمان، حتى ما يضل مكانها فاضي
image.addEventListener("error", reveal, { once: true });
});
}

// 4) ميلان الكرت مع الماوس: مستمع واحد على مستوى الصفحة بيخدم كل كرت عليه data-tilt — حتى اللي بينرسم بعدين — وزاوية الميلان بتنكتب inline
// ------------------------------------------------------------------

const maxTiltDegrees = 5;

// مستمع واحد على مستوى الصفحة بيخدم كل الكروت — حتى اللي بينرسم بعدين.
// بنكتب التحويل مباشرة كخاصية inline، فما احتجنا ولا سطر CSS.
function handlePointerMove(event) {
const card = event.target.closest("[data-tilt]");

if (!card) {
return;
}

const bounds = card.getBoundingClientRect();
const horizontalRatio = (event.clientX - bounds.left) / bounds.width;
const verticalRatio = (event.clientY - bounds.top) / bounds.height;

// نص الكرت = صفر، والحواف = أقصى زاوية بالاتجاهين
const rotateY = (horizontalRatio - 0.5) * 2 * maxTiltDegrees;
const rotateX = (0.5 - verticalRatio) * 2 * maxTiltDegrees;

card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// أول ما الماوس يطلع من الكرت بنرجّعه لوضعه الطبيعي
function handlePointerLeave(event) {
const card = event.target.closest("[data-tilt]");

if (card) {
card.style.transform = "";
}
}

function bindTilt() {
if (!hasPointer || prefersReducedMotion) {
return;
}

document.addEventListener("pointermove", handlePointerMove, { passive: true });
document.addEventListener("pointerout", handlePointerLeave, { passive: true });
}

// 5) التشغيل: بنشغّل كل الحركات مرة وحدة، وبنراقب أي محتوى جديد بينضاف للصفحة حتى تشتغل عليه نفس الحركات بلا ما ننادي شي من كل شاشة
// ------------------------------------------------------------------

function refresh() {
observeReveals();
applyStagger();
revealImages();
}

// معظم محتوى الموقع بينرسم من JavaScript بعد تحميل الصفحة، فبنراقب أي إضافة
// جديدة للـDOM ونشغّل عليها نفس الحركات بدل ما ننادي الدالة يدويًا من كل شاشة
function watchNewContent() {
new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
}

let isStarted = false;

export function initAnimations() {
if (isStarted) {
return;
}

isStarted = true;

refresh();
bindTilt();
watchNewContent();
}
