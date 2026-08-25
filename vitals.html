<!DOCTYPE html>
<html lang="ar" dir="rtl" class="overflow-x-clip">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>السجلات الحيوية | مستشفى النبض التخصصي</title>
<meta name="description" content="سجل القراءات الحيوية لمرضى القلب مع تسجيل قراءة جديدة وتصفية حسب حالة القراءة.">
<link rel="icon" href="images/favicon.svg" type="image/svg+xml">

<!-- مكتبات جاهزة من الإنترنت: Tailwind بيعطينا كلاسات التنسيق، وLucide بيحوّل كل عنصر عليه data-lucide لأيقونة، وخط Cairo للعربي -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap">

<!-- ألوان المشروع وحركاته مكتوبة كإعدادات لـTailwind بدل ملف CSS، والسطر اللي بعده بيلوّن خلفية الصفحة غامق فورًا بالوضع الليلي حتى ما تلمع أبيض لحظة التحميل -->
<script src="js/tailwind-theme.js"></script>
<script>if (localStorage.getItem("cardiac.theme") === "dark") { document.documentElement.style.backgroundColor = "#071510"; }</script>
</head>
<body class="min-h-screen overflow-x-clip bg-slate-50 text-slate-800 antialiased [font-family:'Cairo','Segoe_UI',Tahoma,Arial,sans-serif]">

<!-- غلاف الشاشة كلها. مخفي بالبداية عن قصد: layout.js أول ما يشتغل بيشوف مين المستخدم، فإذا ما في جلسة بيحوّله على صفحة الدخول قبل ما يبيّن، وإذا في جلسة بيشيل الـhidden وبتظهر الصفحة -->
<div id="appShell" class="hidden min-h-screen">

<!-- طبقة غامقة بتغطي الصفحة ورا القائمة الجانبية وقت ما تنفتح على الهاتف، والضغط عليها بيسكّر القائمة -->
<div id="sidebarBackdrop" class="fixed inset-0 z-30 hidden bg-ink/50 lg:hidden"></div>

<!-- القائمة الجانبية على اليمين: ثابتة ومفتوحة دايمًا على الشاشة الكبيرة، وعلى الهاتف بتكون مزحوطة برا الشاشة (translate-x-full) وبتنزلق لما تضغط زر القائمة بالهيدر -->
<aside id="sidebar" class="fixed inset-y-0 right-0 z-40 flex w-72 translate-x-full flex-col border-l border-slate-200 bg-surface transition-transform duration-300 ease-out lg:translate-x-0">

<!-- رأس القائمة: شعار المستشفى واسمه، وجنبه زر × اللي بيسكّر القائمة وما بيبيّن إلا على الهاتف -->
<div class="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-5">
<div class="flex items-center gap-3">
<img src="images/logo.svg" alt="" class="h-9 w-9" aria-hidden="true">
<div>
<p class="text-sm font-bold text-slate-900">مستشفى النبض التخصصي</p>
<p class="text-xs text-slate-500">لأمراض القلب والشرايين</p>
</div>
</div>
<button id="closeSidebar" type="button" aria-label="إغلاق القائمة" class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition duration-300 hover:bg-slate-50 lg:hidden">
<i data-lucide="x" class="h-4 w-4" aria-hidden="true"></i>
</button>
</div>

<!-- روابط شاشات النظام. كل رابط مكتوب عليه data-roles فيها الأدوار المسموح إلها تفوت الشاشة، وlayout.js بيشيل من الصفحة أي رابط مش من صلاحية المستخدم، والرابط الحالي ملوّن بالأخضر ومكتوب عليه aria-current -->
<nav aria-label="القائمة الرئيسية" class="flex-1 space-y-1 px-3 py-4">
<a href="dashboard.html" data-roles="طبيب,ممرضة,موظف استقبال" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
<i data-lucide="layout-dashboard" class="h-4 w-4" aria-hidden="true"></i>
<span>لوحة التحكم</span>
</a>

<a href="patients.html" data-roles="طبيب,ممرضة,موظف استقبال" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
<i data-lucide="users-round" class="h-4 w-4" aria-hidden="true"></i>
<span>المرضى</span>
</a>

<a href="vitals.html" data-roles="طبيب,ممرضة" aria-current="page" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-teal-50 text-teal-700">
<i data-lucide="activity" class="h-4 w-4" aria-hidden="true"></i>
<span>السجلات الحيوية</span>
</a>

<a href="appointments.html" data-roles="طبيب,ممرضة,موظف استقبال" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
<i data-lucide="calendar-clock" class="h-4 w-4" aria-hidden="true"></i>
<span>المواعيد</span>
</a>

<a href="reports.html" data-roles="طبيب" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
<i data-lucide="bar-chart-3" class="h-4 w-4" aria-hidden="true"></i>
<span>التقارير</span>
</a>
</nav>

<!-- آخر القائمة: رابط بيرجّعك للموقع التعريفي، وزر خروج بيمسح الجلسة من المتصفح وبيوديك على صفحة الدخول -->
<div class="space-y-1 border-t border-slate-200 p-3">
<a href="index.html" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition duration-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-200">
<i data-lucide="hospital" class="h-4 w-4" aria-hidden="true"></i>
<span>موقع المستشفى</span>
</a>
<button data-logout type="button" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition duration-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200">
<i data-lucide="log-out" class="h-4 w-4" aria-hidden="true"></i>
<span>تسجيل الخروج</span>
</button>
</div>
</aside>

<!-- باقي الصفحة. الـpadding من اليمين (lg:pr-72) بيترك مكان للقائمة الجانبية على الشاشة الكبيرة حتى ما تركب فوق المحتوى -->
<div class="lg:pr-72">

<!-- الهيدر الثابت فوق الصفحة (sticky) — بيضل ظاهر وأنت بتنزل، وفيه من اليمين اسم الشاشة ومن الشمال أدوات المستخدم -->
<header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">

<!-- زر فتح القائمة (بيبيّن على الهاتف بس) وجنبه اسم الشاشة اللي أنت فيها -->
<div class="flex items-center gap-3">
<button id="openSidebar" type="button" aria-label="فتح القائمة" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition duration-300 hover:bg-slate-50 lg:hidden">
<i data-lucide="menu" class="h-5 w-5" aria-hidden="true"></i>
</button>
<div>
<p class="text-sm font-bold text-slate-900 sm:text-base">السجلات الحيوية</p>
<p class="hidden text-xs text-slate-500 sm:block">لأمراض القلب والشرايين</p>
</div>
</div>

<div class="flex items-center gap-2 sm:gap-3">

<!-- تاريخ اليوم والساعة، وlayout.js بيكتب التاريخ مرة وحدة وبيحدّث الساعة كل ثانية. بتختفي على الشاشة الصغيرة توفيرًا للمساحة -->
<div class="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
<i data-lucide="calendar-days" class="h-4 w-4 text-teal-600" aria-hidden="true"></i>
<span id="headerDate"></span>
<span class="h-3 w-px bg-slate-300" aria-hidden="true"></span>
<i data-lucide="clock" class="h-4 w-4 text-teal-600" aria-hidden="true"></i>
<time id="headerClock"></time>
</div>

<!-- زر الوضع الليلي/النهاري. فاضي هون عن قصد لأن theme.js بيحط جواته أيقونة شمس أو قمر حسب الوضع الحالي، والضغط عليه بيبدّل الوضع وبيعمل reload حتى Tailwind يبني الألوان الجديدة -->
<button data-theme-toggle type="button" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"></button>

<!-- جرس التنبيهات: الرقم الأحمر فوقه بيعد الإشعارات اللي ما قريتها، والضغط عليه بيفتح اللوحة اللي تحت -->
<div class="relative">
<button id="alertsButton" type="button" aria-label="التنبيهات" aria-expanded="false" class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-200">
<i data-lucide="bell" class="h-5 w-5" aria-hidden="true"></i>
<span id="alertsCount" class="absolute -left-1 -top-1 hidden h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white"></span>
</button>

<!-- لوحة التنبيهات المنسدلة: عنوانها وزر «تعليم الكل كمقروء» مكتوبين هون، أما قائمة التنبيهات نفسها (حالات حرجة، مواعيد عاجلة، وإجراءات الزملاء) فبيعبّيها layout.js من البيانات -->
<div id="alertsPanel" class="animate-slideDown absolute left-0 top-12 z-50 hidden w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-surface p-3 shadow-xl">
<div class="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
<p class="text-sm font-bold text-slate-900">التنبيهات</p>
<button id="markAlertsRead" type="button" class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition duration-300 hover:bg-slate-200">تعليم الكل كمقروء</button>
</div>
<div id="alertsList" class="max-h-80 space-y-1 overflow-y-auto"></div>
</div>
</div>

<!-- اسم صاحب الجلسة ومسماه الوظيفي ومربع فيه أول حرفين من اسمه. الاسم والحروف بيكتبهم layout.js من ملف المستخدمين، والمسمى الوظيفي مكتوب للأدوار التلاتة وبيضل منه واحد بس حسب الدور -->
<div class="hidden items-center gap-3 sm:flex">
<div class="text-left">
<p id="headerUserName" class="text-sm font-bold text-slate-900"></p>
<p class="text-xs text-slate-500">
<span data-role-only="طبيب">طبيب قلب</span>
<span data-role-only="ممرضة">ممرضة قسم القلب</span>
<span data-role-only="موظف استقبال">موظف استقبال</span>
</p>
</div>
<span id="headerAvatar" class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white"></span>
</div>

<!-- نفس زر الخروج اللي بالقائمة بس بشكل أيقونة، موجود هون عشان يكون قريب على الشاشة الصغيرة -->
<button data-logout type="button" aria-label="تسجيل الخروج" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition duration-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200">
<i data-lucide="log-out" class="h-5 w-5" aria-hidden="true"></i>
</button>
</div>
</header>

<!-- محتوى الصفحة نفسه، وهو الجزء الوحيد اللي بيفرق من شاشة لشاشة. بيدخل بحركة خفيفة من تحت (animate-fadeUp) -->
<main id="page-content" class="animate-fadeUp p-4 sm:p-6 lg:p-8">
<!-- شاشة الانتظار اللي بتبيّن أول ما تفتح الصفحة، وvitals.js بيخفيها أول ما توصل البيانات -->
<div id="vitalsLoading" class="animate-fadeIn flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-surface p-8 shadow-sm" role="status">
<div class="flex items-center gap-3 text-slate-500">
<span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" aria-hidden="true"></span>
<span class="text-sm font-medium">جاري تحميل السجلات الحيوية...</span>
</div>
</div>

<!-- صندوق الخطأ: بيبيّن إذا فشل تحميل البيانات، وزر «إعادة المحاولة» بيجرّب يجيبها من جديد -->
<div id="vitalsError" class="hidden animate-pop rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
<span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-rose-600">
<i data-lucide="triangle-alert" class="h-5 w-5" aria-hidden="true"></i>
</span>
<p class="mt-3 text-sm font-semibold text-rose-800">تعذر تحميل السجلات الحيوية. يرجى المحاولة مرة أخرى.</p>
<button id="retryVitals" type="button" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-danger to-danger-dark hover:from-danger-dark hover:to-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-rose-300">
<i data-lucide="rotate-cw" class="h-4 w-4" aria-hidden="true"></i>
إعادة المحاولة
</button>
</div>

<!-- جسم الصفحة كله، مخفي لحد ما تجهز البيانات وبعدين vitals.js بيشيل الـhidden وبيبيّنه -->
<div id="vitalsBody" class="hidden">
<!-- عنوان الصفحة ووصفها، والوصف مكتوب مرتين — للطبيب وللممرضة — وlayout.js بيخلي الوصف اللي بيخص المستخدم بس -->
<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
<div>
<h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">السجلات الحيوية</h1>
<p class="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
<span data-role-only="طبيب">راجع مؤشرات المرضى الحيوية، وسجّل قراءة جديدة أثناء المتابعة.</span>
<span data-role-only="ممرضة">سجّلي قراءات الجولة التمريضية، وتابعي المؤشرات التي تحتاج انتباهًا.</span>
</p>
</div>
</div>

<!-- تلات بطاقات بتلخّص سجل القراءات كله: كم قراءة طبيعية وكم تحتاج انتباه وكم حرجة. العناوين والألوان ثابتة، وvitals.js بيعد القراءات وبيحط الرقم مكان data-stat، وبيعيد العد بعد كل إضافة أو تعديل أو حذف -->
<div id="vitalsSummary" class="mb-6 grid gap-4 sm:grid-cols-3">
<article class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
<div class="flex items-start justify-between gap-4">
<div class="min-w-0">
<p class="text-sm font-medium text-slate-500">قراءات طبيعية</p>
<p data-stat="normal" class="mt-3 text-3xl font-bold text-slate-900"></p>
</div>
<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
<i data-lucide="shield-check" class="h-5 w-5" aria-hidden="true"></i>
</span>
</div>
</article>
<article class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
<div class="flex items-start justify-between gap-4">
<div class="min-w-0">
<p class="text-sm font-medium text-slate-500">قراءات تحتاج انتباه</p>
<p data-stat="warning" class="mt-3 text-3xl font-bold text-slate-900"></p>
</div>
<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
<i data-lucide="clipboard-list" class="h-5 w-5" aria-hidden="true"></i>
</span>
</div>
</article>
<article class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
<div class="flex items-start justify-between gap-4">
<div class="min-w-0">
<p class="text-sm font-medium text-slate-500">قراءات حرجة</p>
<p data-stat="critical" class="mt-3 text-3xl font-bold text-slate-900"></p>
</div>
<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
<i data-lucide="heart-pulse" class="h-5 w-5" aria-hidden="true"></i>
</span>
</div>
</article>
</div>

<section data-reveal class="transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg min-w-0 rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
<div>
<h2 class="text-base font-bold text-slate-900">تسجيل قراءة حيوية</h2>
<p class="mt-1 text-sm text-slate-500">
<span data-role-only="طبيب">تُضاف القراءة مباشرة إلى سجل المريض، ويمكن تعديلها أو حذفها لاحقًا من زر التعديل في الجدول</span>
<span data-role-only="ممرضة">تُضاف القراءة مباشرة إلى سجل المريض، ويمكنك تعديل القراءات التي سجّلتِها بنفسك</span>
</p>
</div>
</div>
<!-- نموذج تسجيل قراءة جديدة: قائمة المرضى بيعبّيها vitals.js من ملف المرضى، وباقي الحقول ثابتة مع حدودها (min/max) كإرشاد للمستخدم. الرفض الحقيقي بيصير بالتحقق قبل الحفظ، ورسالة الخطأ بتطلع بالـspan اللي تحت كل حقل -->
<form id="vitalForm" novalidate class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">المريض</span>
<select id="vitalPatient" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
<option value="">اختر المريض</option>
</select>
<span id="vitalPatientError" class="hidden text-xs font-semibold text-rose-600"></span>
</label>

<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">نبض القلب (نبضة/دقيقة)</span>
<input id="vitalHeartRate" type="number" inputmode="numeric" min="40" max="220" placeholder="78" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
<span id="vitalHeartRateError" class="hidden text-xs font-semibold text-rose-600"></span>
</label>

<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">ضغط الدم (انقباضي/انبساطي)</span>
<input id="vitalBloodPressure" type="text" inputmode="text" autocomplete="off" placeholder="120/80" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
<span id="vitalBloodPressureError" class="hidden text-xs font-semibold text-rose-600"></span>
</label>

<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">مستوى الأكسجين (%)</span>
<input id="vitalOxygen" type="number" inputmode="numeric" min="60" max="100" placeholder="97" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
<span id="vitalOxygenError" class="hidden text-xs font-semibold text-rose-600"></span>
</label>

<div class="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-4">
<button type="submit" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand to-brand-dark hover:from-brand-dark hover:to-brand px-4 text-sm font-semibold text-white shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-300">
<i data-lucide="save" class="h-4 w-4" aria-hidden="true"></i>
حفظ القراءة
</button>
<button id="clearVitalForm" type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300">
<i data-lucide="eraser" class="h-4 w-4" aria-hidden="true"></i>
مسح الحقول
</button>
</div>
</form>
</section>

<div class="mt-6">
<!-- تصفية سجل القراءات: بحث باسم المريض وقائمة بحالة القراءة، وأي تغيير فيهن بيخلي vitals.js يعيد رسم صفوف الجدول فورًا. السطر اللي تحتهن بيقول كم قراءة ظاهرة من الكل -->
<section class="mb-5 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">البحث عن مريض</span>
<span class="relative block">
<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><i data-lucide="search" class="h-4 w-4" aria-hidden="true"></i></span>
<input id="vitalSearch" type="search" autocomplete="off" placeholder="ابحث باسم المريض" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 pr-10">
</span>
</label>
<label class="flex flex-col gap-2">
<span class="text-xs font-semibold text-slate-500">حالة القراءة</span>
<select id="readingStatusFilter" class="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
<option value="All">كل القراءات</option>
<option value="طبيعية">طبيعية</option>
<option value="تحتاج انتباه">تحتاج انتباه</option>
<option value="حرجة">حرجة</option>
</select>
</label>
</div>
<p id="vitalsCount" class="mt-3 text-xs font-semibold text-slate-500"></p>
</section>
</div>

<!-- مكان فاضي بيرسم فيه edit-panel.js لوحة تعديل القراءة لما تضغط زر «تعديل» بالجدول، وجواتها زر حذف بيبيّن للطبيب بس -->
<div id="vitalEditPanel"></div>

<!-- سجل القراءات كله: القراءة المرجعية من ملف المستشفى مع القراءات اللي سجّلها الطاقم، مرتّبة من الأحدث. رؤوس الأعمدة ثابتة وvitals.js بيبني الصفوف، وعمود الإجراءات بيبيّن زر «تعديل» إذا المستخدم صاحب القراءة وإلا بيكتب سبب القفل -->
<div id="vitalsResults">
<div id="vitalsTable" data-reveal class="overflow-x-auto rounded-2xl border border-slate-200 bg-surface shadow-sm">
<table class="min-w-full divide-y divide-slate-200 text-right text-sm">
<thead class="bg-slate-50 text-xs font-semibold text-slate-500">
<tr>
<th scope="col" class="whitespace-nowrap px-4 py-3">المريض</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">نبض القلب</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">ضغط الدم</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">الأكسجين</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">حالة المريض</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">حالة القراءة</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">سجّلها</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">وقت التسجيل</th>
<th scope="col" class="whitespace-nowrap px-4 py-3">الإجراءات</th>
</tr>
</thead>
<tbody id="vitalsRows" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<div id="vitalsEmpty" class="hidden animate-fadeIn rounded-2xl border border-dashed border-slate-300 bg-surface p-8 text-center">
<span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
<i data-lucide="inbox" class="h-5 w-5" aria-hidden="true"></i>
</span>
<h3 class="mt-3 text-sm font-bold text-slate-800">لا توجد قراءات مطابقة</h3>
<p class="mt-1 text-sm text-slate-500">جرّب اسمًا آخر أو غيّر حالة القراءة.</p>
</div>
</div>
</div>
</main>

</div>
</div>

<!-- مكان رسائل «تم الحفظ» و«صار خطأ» اللي بتطلع تحت على الشمال. بيضل فاضي لحد ما ui.js يرمي فيه رسالة، وبتختفي لحالها بعد تلات ثواني -->
<div id="toastContainer" aria-live="polite" class="fixed bottom-4 left-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"></div>

<!-- ملف الجافاسكربت الخاص بهالصفحة: بيجيب البيانات وبيعبّي الفراغات اللي فوق وبيربط الأزرار -->
<script type="module" src="js/vitals.js"></script>
</body>
</html>
