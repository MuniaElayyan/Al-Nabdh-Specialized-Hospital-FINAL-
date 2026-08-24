// صفحة التقارير: كل العناوين والبطاقات والجداول مكتوبة داخل reports.html،
// وهذا الملف بيحسب الأرقام من البيانات وبيحطها بمكانها، وبيعبّي صفوف الجداول.

import { initPage } from "./layout.js";
import { getPatients, getAppointmentsWithPatients } from "./api.js";
import { conditionBadge, renderIcons } from "./ui.js";
import { onDataChange } from "./storage.js";
import { collectPatientRecord, openDetailsPanel, closeDetailsPanel, detailsRowButton } from "./patient-report.js";
import { escapeHtml, average, formatVitalValue, formatTextValue, conditions, summarizeAppointments, roles } from "./helpers.js";

let allPatients = [];
let allAppointments = [];
let detailsId = "";

const filters = { query: "", condition: "All" };

// الحسابات: كل رقم بالتقرير محسوب من بيانات المرضى والمواعيد، ما في رقم مكتوب بالإيد

function countPatientsByCondition(condition) {
return allPatients.filter((patient) => patient.condition === condition).length;
}

function calculateReportStats() {
return {
total: allPatients.length,
stable: countPatientsByCondition(conditions.stable),
followUp: countPatientsByCondition(conditions.followUp),
critical: countPatientsByCondition(conditions.critical),
averageHeartRate: average(allPatients.map((patient) => Number(patient.heartRate))),
averageOxygen: average(allPatients.map((patient) => Number(patient.oxygenLevel))),
// أرقام المواعيد من summarizeAppointments، نفس اللي بتستعمله اللوحة وصفحة المواعيد
appointments: summarizeAppointments(allAppointments)
};
}

// نسبة مئوية مقرّبة، ومحمية من القسمة على صفر
function toPercent(count, total) {
if (!total) {
return 0;
}

return Math.round((count / total) * 100);
}

// تعبئة الأرقام: بنكتب قيم البطاقات ونسب توزيع الحالات بمكانها المكتوب بالـHTML

function setStat(name, value) {
const element = document.querySelector(`[data-stat="${name}"]`);

if (element) {
element.textContent = String(value);
}
}

function setStatNote(name, value) {
const element = document.querySelector(`[data-stat-note="${name}"]`);

if (element) {
element.textContent = value;
}
}

function fillStats(stats) {
setStat("total", stats.total);
setStat("stable", stats.stable);
setStat("critical", stats.critical);
setStat("followUp", stats.followUp);
setStat("averageHeartRate", stats.averageHeartRate);
setStat("averageOxygen", `${stats.averageOxygen}%`);
setStat("appointmentsTotal", stats.appointments.total);
setStat("appointmentsUrgent", stats.appointments.urgent);
setStat("appointmentsCompleted", stats.appointments.completed);

setStatNote("appointmentsTotal", `${stats.appointments.upcoming} قادمة · ${stats.appointments.past} سابقة`);
}

// توزيع حالات المرضى: العدد والنسبة، وعرض الشريط بقد النسبة
function fillDistribution(stats) {
[["stable", stats.stable], ["followUp", stats.followUp], ["critical", stats.critical]].forEach(([name, count]) => {
const percent = toPercent(count, stats.total);

document.querySelector(`[data-dist-label="${name}"]`).textContent = `${count} مريض — ${percent}%`;
document.querySelector(`[data-dist-bar="${name}"]`).style.width = `${percent}%`;
});
}

// توزيع التشخيصات: بنجمع المرضى حسب تشخيصهم، والمريض اللي لسا بلا تشخيص بينحسب تحت «غير محدد»

function getDiagnosisSummary() {
const labelled = allPatients.map((patient) => formatTextValue(patient.diagnosis));
const uniqueDiagnoses = [...new Set(labelled)];

return uniqueDiagnoses
.map((diagnosis) => ({ diagnosis, count: labelled.filter((item) => item === diagnosis).length }))
.sort((first, second) => second.count - first.count);
}

function fillDiagnosisSummary(total) {
const summary = getDiagnosisSummary();
const table = document.getElementById("diagnosisTable");
const empty = document.getElementById("diagnosisEmpty");

// ما في تشخيصات؟ بنخفي الجدول وبنبيّن صندوق «لا توجد بيانات» المكتوب بالصفحة
table.classList.toggle("hidden", !summary.length);
empty.classList.toggle("hidden", Boolean(summary.length));

document.getElementById("diagnosisRows").innerHTML = summary
.map(
(item) => `
<tr class="transition duration-300 hover:bg-slate-50">
<td class="px-4 py-3 font-semibold text-slate-900">${escapeHtml(item.diagnosis)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${item.count}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${toPercent(item.count, total)}%</td>
</tr>`
)
.join("");
}

// ملخص المرضى: جدول قابل للبحث والتصفية، وكل صف فيه زر بيفتح ملف المريض الكامل بلوحة فوق الجدول

function getVisiblePatients() {
const query = filters.query.trim().toLowerCase();

return allPatients.filter((patient) => {
const matchesQuery = query === "" || patient.name.toLowerCase().includes(query);
const matchesCondition = filters.condition === "All" || patient.condition === filters.condition;

return matchesQuery && matchesCondition;
});
}

function renderPatientSummary() {
const patients = getVisiblePatients();
const table = document.getElementById("reportTable");
const empty = document.getElementById("reportEmpty");
const count = document.getElementById("reportCount");

const hasResults = patients.length > 0;

table.classList.toggle("hidden", !hasResults);
count.classList.toggle("hidden", !hasResults);
empty.classList.toggle("hidden", hasResults);

if (!hasResults) {
document.getElementById("reportRows").innerHTML = "";
renderIcons();
return;
}

count.textContent = `عدد المرضى في التقرير: ${patients.length} من ${allPatients.length}`;

document.getElementById("reportRows").innerHTML = patients
.map(
(patient) => `
<tr class="${patient.id === detailsId ? "bg-teal-50" : ""}">
<td class="whitespace-nowrap px-4 py-3">
<a href="patient-details.html?id=${encodeURIComponent(patient.id)}" class="font-semibold text-slate-900 transition duration-300 hover:text-teal-700">${escapeHtml(patient.name)}</a>
</td>
<td class="whitespace-nowrap px-4 py-3">${conditionBadge(patient.condition)}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatVitalValue(patient.heartRate, " نبضة/دقيقة"))}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatVitalValue(patient.bloodPressure))}</td>
<td class="whitespace-nowrap px-4 py-3 text-slate-600">${escapeHtml(formatVitalValue(patient.oxygenLevel, "%"))}</td>
<td class="whitespace-nowrap px-4 py-3">${detailsRowButton(patient.id)}</td>
</tr>`
)
.join("");

renderIcons();
}

// الأحداث: بنربط البحث والتصفية وأزرار التفاصيل مرة وحدة، لأن العناصر مكتوبة بالـHTML وما بتنعاد كتابتها

// التقارير للطبيب، فبتنعرض كل المعلومات السريرية بلوحة التفاصيل
async function openPatientDetails(patientId) {
const record = await collectPatientRecord(patientId);

if (!record) {
return;
}

detailsId = patientId;
renderPatientSummary();

openDetailsPanel({
mount: "reportDetailsPanel",
record,
showClinical: true,
onClose: () => {
detailsId = "";
renderPatientSummary();
}
});
}

// بنربطها مرة وحدة، لأن الحقول والجداول مكتوبة بالصفحة وما بتنعاد كتابتها
function bindEvents() {
document.getElementById("reportPatientSummary").addEventListener("click", (event) => {
const button = event.target.closest("[data-details-id]");

if (button) {
openPatientDetails(button.dataset.detailsId);
}
});

document.getElementById("reportSearch").addEventListener("input", (event) => {
filters.query = event.target.value;
renderPatientSummary();
});

document.getElementById("reportConditionFilter").addEventListener("change", (event) => {
filters.condition = event.target.value;
renderPatientSummary();
});
}

// التشغيل: بنجيب البيانات وبنعبّي التقرير، وبنعيد الحساب مع أي تغيير من أي دور

async function loadReports() {
const loading = document.getElementById("reportsLoading");
const errorBox = document.getElementById("reportsError");
const body = document.getElementById("reportsBody");

try {
allPatients = await getPatients();
allAppointments = await getAppointmentsWithPatients();

const stats = calculateReportStats();

fillStats(stats);
fillDistribution(stats);
fillDiagnosisSummary(stats.total);
renderPatientSummary();

loading.classList.add("hidden");
errorBox.classList.add("hidden");
body.classList.remove("hidden");
} catch (error) {
console.error(error);
loading.classList.add("hidden");
body.classList.add("hidden");
errorBox.classList.remove("hidden");
} finally {
renderIcons();
}
}

async function start() {
// التقارير الإدارية للطبيب فقط، فالممرضة بترجع للوحة التحكم لو فتحت الرابط
const context = await initPage("reports", [roles.doctor]);

if (!context) {
return;
}

bindEvents();
document.getElementById("retryReports").addEventListener("click", loadReports);

await loadReports();

// أي تحديث حالة أو موعد جديد — حتى لو من تبويب الممرضة أو الاستقبال — بينعكس على التقرير
onDataChange(() => {
// الصفحة رح تتحدث، فأي لوحة تفاصيل مفتوحة لازم تنسكّر أول
closeDetailsPanel();
detailsId = "";
loadReports();
});
}

start();
