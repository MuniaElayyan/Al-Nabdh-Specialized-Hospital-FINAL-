/* هوية المشروع اللونية والحركات — مكتوبة كإعدادات Tailwind بلا أي ملف CSS.
 *
 * ليش هيك؟ Tailwind من الـCDN بيبني الستايل وقت التحميل من الكائن tailwind.config.
 * فبدل ما نكتب CSS، بنعرّف الألوان والحركات هون بـJavaScript وTailwind بيولّدها.
 *
 * فكرة الوضع الليلي: بدل ما نضيف dark: على مئات العناصر، بنقلب المقياس المحايد نفسه.
 * يعني slate-50 (خلفية الصفحة) بتصير غامقة، وslate-900 (النص) بيصير فاتح.
 * الكلاسات بالصفحات ما بتتغير أبدًا — بس القيم اللي وراها بتتبدل.
 *
 * ملاحظة: هذا ملف سكربت عادي (مش module) عشان يشتغل فورًا بعد سكربت Tailwind
 * وقبل ما يبدأ رسم الصفحة.
 */
(function () {
  var isDark = localStorage.getItem("cardiac.theme") === "dark";

  /* 1) المقياس المحايد — أخضر خفيف، وبينقلب كامل بالوضع الليلي
     بالنهاري: 50 أفتح خلفية … 900 أغمق نص
     بالليلي:  50 أغمق خلفية … 900 أفتح نص                                */
  var neutralLight = {
    50: "#eef7f1", 100: "#e2f1e8", 200: "#d0e6d9", 300: "#b5d6c3", 400: "#547c6a",
    500: "#4c7361", 600: "#3f6c54", 700: "#275039", 800: "#183526", 900: "#0d2419", 950: "#071510"
  };

  var neutralDark = {
    50: "#071510", 100: "#142a1e", 200: "#1e3d2c", 300: "#2c5540", 400: "#7ba894",
    500: "#96bda7", 600: "#b0d0be", 700: "#c8e0d4", 800: "#dcefe4", 900: "#eef8f2", 950: "#f4fbf7"
  };

  /* 2) الأخضر الأساسي — للنصوص والحدود والشارات */
  var brandLight = {
    50: "#effaf3", 100: "#d8f3e2", 200: "#b3e6c8", 300: "#80d3a6", 400: "#4cbb82",
    500: "#22a163", 600: "#15834f", 700: "#116941", 800: "#115436", 900: "#0e442d"
  };

  var brandDark = {
    50: "#12291d", 100: "#173925", 200: "#205033", 300: "#2d6f47", 400: "#46a06a",
    500: "#5cc086", 600: "#74d69c", 700: "#93e4b3", 800: "#b3eecb", 900: "#d3f7e2"
  };

  /* 3) ألوان الحالات: خطر / تنبيه / معلومة — مضبوطة لتتناغم مع الأخضر */
  var dangerLight = { 50: "#fdf2f3", 200: "#f7c9ce", 500: "#dd4550", 600: "#c92c39", 700: "#a72330", 800: "#871d29" };
  var dangerDark = { 50: "#2e1418", 200: "#57262d", 500: "#f0737b", 600: "#f78d94", 700: "#ffb0b5", 800: "#ffd0d3" };

  var warnLight = { 50: "#fff8ea", 200: "#f9e0af", 500: "#d9950f", 600: "#bd7c08", 700: "#986307", 800: "#7a500a" };
  var warnDark = { 50: "#2e2210", 200: "#54401a", 500: "#e5b04a", 600: "#efc266", 700: "#f6d693", 800: "#fce8bb" };

  var infoLight = { 50: "#edf6fb", 200: "#bcdff0", 500: "#2a9dd3", 600: "#1d82b3", 700: "#186890" };
  var infoDark = { 50: "#0f2634", 200: "#1c4257", 500: "#4bb6e6", 600: "#70c8ef", 700: "#9fddf7" };

  var neutral = isDark ? neutralDark : neutralLight;
  var brand = isDark ? brandDark : brandLight;

  tailwind.config = {
    theme: {
      extend: {
        colors: {
          /* slate = المحايد، teal = الأخضر — أسماء موجودة أصلًا بكل الصفحات
             فما احتجنا نغيّر ولا كلاس بالواجهة                              */
          slate: neutral,
          teal: brand,
          cyan: brand,
          emerald: brand,
          rose: isDark ? dangerDark : dangerLight,
          amber: isDark ? warnDark : warnLight,
          sky: isDark ? infoDark : infoLight,

          /* سطح البطاقات: أبيض بالنهاري، وأفتح شوي من خلفية الصفحة بالليلي.
             منفصل عن white عشان text-white يضل أبيض على الأزرار الملوّنة.   */
          surface: isDark ? "#102a1d" : "#ffffff",

          /* أخضر ثابت لخلفيات الأزرار — بيضل غامق بالوضعين حتى يضل
             النص الأبيض فوقه مقروء                                          */
          brand: { DEFAULT: "#15834f", dark: "#116941" },

          /* أحمر ثابت لأزرار الحذف، بنفس المنطق */
          danger: { DEFAULT: "#c92c39", dark: "#a72330" },

          /* غامق ثابت: أقسام العرض الداكنة والطبقات فوق الصور — ما بينقلب */
          ink: "#08170f"
        },

        /* 4) الحركات — Tailwind بيولّد animate-* منها، بلا أي CSS مكتوب بالإيد */
        keyframes: {
          fadeUp: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "none" } },
          fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
          scaleIn: { "0%": { opacity: "0", transform: "scale(.96)" }, "100%": { opacity: "1", transform: "none" } },
          slideDown: { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "none" } },
          pop: {
            "0%": { opacity: "0", transform: "scale(.94) translateY(10px)" },
            "60%": { transform: "scale(1.01) translateY(0)" },
            "100%": { opacity: "1", transform: "none" }
          },
          float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } }
        },
        animation: {
          fadeUp: "fadeUp .52s cubic-bezier(.22,.68,.32,1) both",
          fadeIn: "fadeIn .28s ease both",
          scaleIn: "scaleIn .28s cubic-bezier(.22,.68,.32,1) both",
          slideDown: "slideDown .3s cubic-bezier(.22,.68,.32,1) both",
          pop: "pop .34s cubic-bezier(.22,.68,.32,1) both",
          float: "float 7s ease-in-out infinite"
        }
      }
    }
  };
})();
