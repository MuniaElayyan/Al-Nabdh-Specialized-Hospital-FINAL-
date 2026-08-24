// لوحة تعديل مشتركة — بتنفتح فوق الجدول وفيها حقول الصف اللي المستخدم ضغط عليه.
//
// نفس اللوحة بتخدم المرضى والمواعيد والقراءات، فما في تكرار للكود بكل شاشة.
// كل شاشة بتقول بس: شو الحقول، شو القيم الحالية، وشو بيصير عند الحفظ.
//
// قاعدة مهمة: اللوحة ما بتلمس البيانات الأصلية أبدًا. بتشتغل على نسخة من القيم،
// وما بينحفظ شي إلا لما دالة onSave تنجح — فالإلغاء ما بيضيّع أي بيانات.

import { escapeHtml } from "./helpers.js";
import { icon, renderIcons, setFieldInvalid, inputClasses, labelClasses, primaryButtonClasses, secondaryButtonClasses } from "./ui.js";

// عرض الحقل داخل الشبكة: عمود واحد، عمودين، أو السطر كامل
const spanClasses = { 1: "", 2: "sm:col-span-2", full: "sm:col-span-2 lg:col-span-3" };

function renderField(field, value) {
  const fieldId = `editField_${field.name}`;
  const errorId = `editError_${field.name}`;
  const currentValue = value ?? "";

  let control = "";

  if (field.type === "select") {
    const options = (field.options || [])
      .map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(currentValue) ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("");

    control = `<select id="${fieldId}" name="${escapeHtml(field.name)}" class="${inputClasses}">${field.placeholder ? `<option value="">${escapeHtml(field.placeholder)}</option>` : ""}${options}</select>`;
  } else if (field.type === "textarea") {
    control = `<textarea id="${fieldId}" name="${escapeHtml(field.name)}" rows="3" placeholder="${escapeHtml(field.placeholder || "")}" class="w-full rounded-xl border border-slate-200 bg-surface p-3 text-sm leading-7 text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">${escapeHtml(currentValue)}</textarea>`;
  } else {
    const limits = [
      field.min !== undefined ? `min="${escapeHtml(field.min)}"` : "",
      field.max !== undefined ? `max="${escapeHtml(field.max)}"` : "",
      field.step !== undefined ? `step="${escapeHtml(field.step)}"` : "",
      field.inputMode ? `inputmode="${escapeHtml(field.inputMode)}"` : ""
    ]
      .filter(Boolean)
      .join(" ");

    control = `<input id="${fieldId}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || "text")}" ${limits} placeholder="${escapeHtml(field.placeholder || "")}" value="${escapeHtml(currentValue)}" class="${inputClasses}">`;
  }

  return `
<label class="flex flex-col gap-2 ${spanClasses[field.span] || ""}">
<span class="${labelClasses}">${escapeHtml(field.label)}</span>
${control}
${field.hint ? `<span class="text-[11px] text-slate-400">${escapeHtml(field.hint)}</span>` : ""}
<span id="${errorId}" class="hidden text-xs font-semibold text-rose-600"></span>
</label>
`;
}

function renderPanel({ title, subtitle, fields, values, saveLabel, deleteLabel }) {
  return `
<section data-edit-panel class="animate-slideDown mb-6 overflow-hidden rounded-2xl border border-teal-200 bg-surface shadow-lg" role="region" aria-label="${escapeHtml(title)}">
<div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-teal-50/70 p-5">
<div class="flex items-start gap-3">
<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-teal-700">${icon("pencil", "h-5 w-5")}</span>
<div>
<h2 class="text-base font-bold text-slate-900">${escapeHtml(title)}</h2>
${subtitle ? `<p class="mt-1 text-sm text-slate-500">${escapeHtml(subtitle)}</p>` : ""}
</div>
</div>
<button type="button" data-panel-close aria-label="إغلاق لوحة التعديل" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition duration-300 hover:bg-slate-50">${icon("x", "h-4 w-4")}</button>
</div>

<form data-panel-form novalidate class="p-5">
<div data-panel-alert class="mb-4 hidden items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-6 text-rose-800" role="alert"></div>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${fields.map((field) => renderField(field, values[field.name])).join("")}
</div>

<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
<button type="submit" data-panel-save class="${primaryButtonClasses}">${icon("save", "h-4 w-4")} ${escapeHtml(saveLabel)}</button>
<button type="button" data-panel-cancel class="${secondaryButtonClasses}">${icon("x", "h-4 w-4")} إلغاء</button>
${deleteLabel ? `<button type="button" data-panel-delete class="mr-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-surface px-4 text-sm font-semibold text-rose-600 shadow-sm transition duration-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200">${icon("trash-2", "h-4 w-4")} ${escapeHtml(deleteLabel)}</button>` : ""}
</div>
</form>
</section>
`;
}

// اللوحة المفتوحة حاليًا — وحدة بس بكل الصفحة، فأي فتح جديد بيقفل القديمة
let activePanel = null;

export function closeEditPanel() {
  if (!activePanel) {
    return;
  }

  const { container, onClose } = activePanel;

  activePanel = null;
  container.innerHTML = "";
  document.removeEventListener("keydown", handleEscape);

  if (onClose) {
    onClose();
  }
}

function handleEscape(event) {
  if (event.key === "Escape") {
    closeEditPanel();
  }
}

// بنعرض رسالة تحت الحقل، وبنحدّد الحقل نفسه بإطار أحمر
function showFieldErrors(container, errors) {
  container.querySelectorAll("[id^='editError_']").forEach((element) => {
    element.textContent = "";
    element.classList.add("hidden");
  });

  container.querySelectorAll("[id^='editField_']").forEach((element) => setFieldInvalid(element, false));

  Object.entries(errors || {}).forEach(([name, message]) => {
    const errorElement = container.querySelector(`#editError_${CSS.escape(name)}`);
    const fieldElement = container.querySelector(`#editField_${CSS.escape(name)}`);

    if (errorElement && message) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
    }

    if (fieldElement && message) {
      setFieldInvalid(fieldElement, true);
    }
  });
}

function showAlert(container, message) {
  const alert = container.querySelector("[data-panel-alert]");

  alert.innerHTML = message ? `${icon("triangle-alert", "h-4 w-4 shrink-0")}<span>${escapeHtml(message)}</span>` : "";
  alert.classList.toggle("hidden", !message);
  alert.classList.toggle("flex", Boolean(message));
  renderIcons();
}

// بنقرأ قيم الحقول من اللوحة كما هي (نصوص)، والتحقق مسؤولية دالة onSave
function readPanelValues(container, fields) {
  const values = {};

  fields.forEach((field) => {
    const element = container.querySelector(`#editField_${CSS.escape(field.name)}`);

    values[field.name] = element ? element.value : "";
  });

  return values;
}

/**
 * بتفتح لوحة التعديل داخل العنصر المحدد.
 *
 * mount       العنصر اللي بتنرسم جواته اللوحة (فوق الجدول)
 * fields      وصف الحقول
 * values      القيم الحالية للصف — بتتعبّى تلقائيًا
 * onSave      دالة بتاخد القيم وبترجّع { errors } أو بترمي خطأ إذا في مشكلة
 * onDelete    اختيارية — لو موجودة بيبيّن زر الحذف داخل اللوحة
 * onReady     اختيارية — بتنادى بعد ما تنرسم الحقول ومعها عنصر اللوحة، للشاشة اللي
 *             بدها تظبط شي على حقولها (مثل حدود التاريخ والوقت بلوحة الموعد)
 */
export function openEditPanel({ mount, title, subtitle = "", fields, values = {}, saveLabel = "حفظ التعديل", deleteLabel = "", onSave, onDelete, onClose, onReady }) {
  const container = typeof mount === "string" ? document.getElementById(mount) : mount;

  if (!container) {
    return;
  }

  closeEditPanel();

  container.innerHTML = renderPanel({ title, subtitle, fields, values, saveLabel, deleteLabel });
  activePanel = { container, onClose };

  const form = container.querySelector("[data-panel-form]");
  const saveButton = container.querySelector("[data-panel-save]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showAlert(container, "");
    showFieldErrors(container, {});
    saveButton.disabled = true;

    try {
      const result = await onSave(readPanelValues(container, fields));

      // النتيجة فيها أخطاء حقول؟ بنعرضها وبنترك اللوحة مفتوحة حتى يصححها المستخدم
      if (result && result.errors && Object.keys(result.errors).length) {
        showFieldErrors(container, result.errors);
        showAlert(container, "يرجى مراجعة الحقول المميزة بالأحمر.");
        return;
      }

      closeEditPanel();
    } catch (error) {
      console.error(error);
      showFieldErrors(container, error.fieldErrors || {});
      showAlert(container, error.message || "تعذر حفظ التعديل.");
    } finally {
      saveButton.disabled = false;
    }
  });

  container.querySelectorAll("[data-panel-cancel], [data-panel-close]").forEach((button) => {
    button.addEventListener("click", closeEditPanel);
  });

  const deleteButton = container.querySelector("[data-panel-delete]");

  if (deleteButton && onDelete) {
    deleteButton.addEventListener("click", async () => {
      const deleted = await onDelete();

      if (deleted) {
        closeEditPanel();
      }
    });
  }

  document.addEventListener("keydown", handleEscape);
  renderIcons();

  if (onReady) {
    onReady(container);
  }

  // بننزّل الشاشة على اللوحة ونركّز أول حقل، حتى يبين للمستخدم إنها فتحت
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const firstField = container.querySelector("[id^='editField_']");

  if (firstField) {
    firstField.focus({ preventScroll: true });
  }
}

export function isEditPanelOpen() {
  return Boolean(activePanel);
}
