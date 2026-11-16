// Знімок даних з Google Drive станом на 16.11.2026.
// Джерело: Процеси → ЄДЕБО та Ліцензування → Оновлення публічної інформації → Документи
//   • розділи = підпапки «Документи», документи = папки «Назва [Тип]» всередині розділу
//   • статус актуальності і відповідальний — таблиця «Звіт по документах»
//   • строки регулярних документів — «Періоди оновлення документів КШЕ», лист «Регулярні — строки»
// Щоб оновити дані, замініть масиви нижче (або підключіть Drive API — див. README).

window.PORTAL_DATA = (() => {
  const TODAY = "2026-11-16";

  const sections = [
    { id: "admission",   name: "Вступна кампанія",            icon: "door",    folder: "1tl_bX0FQ1G-l9n4ARQ079k2cCeoOWrQ9" },
    { id: "finance",     name: "Фінансові питання",           icon: "coins",   folder: "1UNHcdzfJ4f6I66pjfvTnkgoH1pA-Sox5" },
    { id: "education",   name: "Освітній процес",             icon: "book",    folder: "1zy_94kC2rZUt9oBdIRESCAd3hEgnmAjJ" },
    { id: "operations",  name: "Операційні питання",          icon: "gear",    folder: "1H5Rdpqg0ne1IUDqUeywSoLUlq265QM1o" },
    { id: "policies",    name: "Загальні політики",           icon: "scale",   folder: "1qN39e3veADPYPg3-DvLjprhvoudPL6vU" },
    { id: "hr",          name: "Кадрові питання",             icon: "users",   folder: "1SfCjiNsXV_vNvt5swK_iXDGJsgiPWqUh" },
    { id: "upbringing",  name: "Виховні процеси",             icon: "heart",   folder: "1ki5xIVDrzS8FUBgYRPzPg1KE9TUVOf0x" },
    { id: "science",     name: "Наука та аспірантура",        icon: "flask",   folder: "1poHFf2abS5BzReTU5baHTk6kNGsi7ozD" },
    { id: "selfgov",     name: "Студентське самоврядування",  icon: "flag",    folder: "1s7jEq5uqQUsscExWf6yJwXNQDBDefVun" },
  ];

  // [розділ, тип, назва, id папки]
  // Типи: R — Регулярний, S — Стихійний, M — Змішаний, N — Не застосовується
  const raw = [
    ["admission", "R", "Відомості про Приймальну комісію ЗВО та визначення повноважень у встановленому законодавством порядку", "1jaXvBANWNAUCSrNHovkwvZKXSzstybMu"],
    ["admission", "R", "Списки зарахованих (накази про зарахування)", "1RIqqOMM6T09-PUTrcZQ7MEnFey0Tghqu"],
    ["admission", "R", "Рішення приймальної комісії щодо надання рекомендацій на зарахування", "1L0KmNtdpYtqfHgnEpShGgpfXe8AkLfdB"],
    ["admission", "R", "Правила прийому до закладу освіти", "1d8SNJFSImeEd5vgAIolpNW9wxevTNTrm"],
    ["admission", "M", "Сторінка англійською мовою з основною інформацією, правилами прийому та умовами навчання іноземців", "1h46RBjdpC9QNrC3Jku3e5zb_cwj10hvt"],
    ["admission", "R", "Програми вступних іспитів, фахових випробувань, співбесід тощо", "1VfrxUB4VyUdTgaWfV4hMnkCfN3fgk8JL"],
    ["admission", "R", "Рейтингові списки вступників", "1fGbkbX6t2Xf38O9wfsDgoVcA0qou7Ovh"],
    ["admission", "R", "Вичерпний перелік освітніх програм з розподілом ліцензованих обсягів для набору у відповідному році", "11HSQGKZUWobtQ1bOww2WyzKvJOdnigC9"],

    ["finance", "R", "Бюджет закладу освіти", "1zZebMjToE7DejjQwUEMAxJd4012Yjmbp"],
    ["finance", "S", "Інформація про проведення тендерних процедур", "1mKEcD6Av6BeX_uY0XDMe2nHatXlamHgu"],
    ["finance", "M", "Перелік додаткових освітніх та інших послуг, їх вартість, порядок надання та оплати", "1cf7_6hpfHEuvOV1dfUpLDiltgdzOD6jL"],
    ["finance", "R", "Інформація про благодійну допомогу та кошти, отримані з інших джерел", "1QZ-9iGWHEGKBgPt68pcYlmZiusGA5zog"],
    ["finance", "M", "Правила призначення академічних стипендій та актуальні рейтинги", "1QctUEdij1x2bQN64AHbWS3JLQIUqcjLH"],
    ["finance", "R", "Кошторис закладу та всі зміни до нього", "13UScQsBBcQ9Pr-K1ISzYO-64fyr9VNeR"],
    ["finance", "R", "Розмір плати за навчання, підготовку, перепідготовку, підвищення кваліфікації", "1k_8P-cksu2NvwIAnk5CcL5FYjDjZRgST"],
    ["finance", "R", "Звіт про використання та надходження коштів", "1Yn37LIwOVh_kTxuc7UYP0z_QRi__lW5B"],
    ["finance", "R", "Фінансовий звіт про надходження та використання всіх отриманих коштів", "1PfuDOKPJ05C2NJJy_vPAl1J_kewkikhu"],

    ["upbringing", "R", "Відомості про гуртожитки, вільні місця, розмір плати за проживання", "1F2bJPRJhgb2bFN4T6QHxtmKEwAvjAcg_"],
    ["upbringing", "S", "Положення про запобігання і протидію насильству та жорстокому поводженню з дітьми", "1Af-8DTRdrDJ7jkvMTDO0JnNrKpD562rG"],
    ["upbringing", "S", "Порядок подання та розгляду заяв про випадки булінгу (цькування)", "16HhXu18Yi5M0655d4isGpEk2tEvFWkWP"],
    ["upbringing", "M", "План заходів, спрямованих на запобігання та протидію булінгу (цькуванню)", "1f-9wxtdW03cRXzFo8AobvrI0up1JIRqJ"],
    ["upbringing", "S", "Правила поведінки здобувача освіти в закладі освіти", "1rtridJqpb7EtzVby23Dcnaf5VG_nk96x"],
    ["upbringing", "S", "Порядок реагування на доведені випадки булінгу та відповідальність причетних осіб", "13HCKNbcE42NYARl9MM_CrtNOGOw63POC"],

    ["science", "S", "Матеріали захистів PhD, разові ради та трансляція атестації", "1tpgHtTtijrsJa6GkpJwRo4SrOpWjiezD"],
    ["science", "S", "Напрями наукової та/або мистецької діяльності", "1gPYuuvEz4mlj3NYh9lkjcugPVoYCXY8j"],

    ["policies", "R", "Річний звіт про діяльність закладу освіти", "1gG6M33s38-KZifyQQWt5ILC3EUpfsqTW"],
    ["policies", "S", "Структура та органи управління закладу освіти", "1KN4jxBlU-sHh_5pk9PGMeAMIdMnpol2V"],
    ["policies", "S", "Цільові показники діяльності керівника, строки та спосіб перевірки їх досягнення", "1njxsyVHHFwMG44Do7ZH1WFmAC4B9rucc"],
    ["policies", "S", "Інша інформація, що оприлюднюється за рішенням закладу або на вимогу законодавства", "1ZT5F8dRSSI0-czUn6WrRAekiGad9Q72P"],
    ["policies", "S", "Склад керівних органів", "1ez3q83fbSsP36UqCfMCvfvYrhlBjG8v-"],
    ["policies", "S", "Статут ЗО (установчі документи)", "1ai2GVeHP6VMh5GEdOnryTkyO_aXx7ju0"],
    ["policies", "N", "Інформація з обмеженим доступом (не застосовується згідно ч. 1 ст. 79 ЗУ «Про вищу освіту»)", "1BpPGg2M1CHo6VuJuiwIqjoCT6hOUFZGo"],
    ["policies", "R", "Щорічний звіт про діяльність керівника закладу освіти", "1f5jd7fOyHLoFbcdTez8yFr1lGh9s2SWi"],

    ["operations", "R", "Свідоцтва про атестацію закладу професійної (професійно-технічної) освіти", "1afhGTQ_JGwFsgStCJJL5Doaz33bXODzf"],
    ["operations", "S", "Матеріально-технічне забезпечення закладу освіти (згідно з ліцензійними умовами)", "18OW3RsvdTNnL67AF-oTmQmAAey3o0uwR"],
    ["operations", "S", "Ліцензії на провадження освітньої діяльності", "10geX3bSF8WwSjJw3C_rdh0_wHqLo_ZA3"],
    ["operations", "N", "Державна атестація закладів ПТО за старими правилами (втратила чинність, ПКМУ № 1146)", "1XblbUsWntC04WzQH1LZ93vgP2jWJLy70"],
    ["operations", "S", "Головна сторінка офіційного веб-сайту ЗВО", "1XzF5SIXcXiJtp5CT0FLNqCB6SYr-aYJR"],
    ["operations", "S", "Перелік професій, за якими здійснюється підготовка у закладі освіти", "17fcJqW9Ow5mTJGUmDI8ItRfZt7Hf5FKJ"],
    ["operations", "S", "Ліцензований обсяг закладу фахової передвищої освіти за кожною спеціальністю", "111scjO-MVUEk8lC3-Me3bsSDDeXYh3i_"],
    ["operations", "R", "Ліцензований обсяг та фактична кількість осіб, які навчаються в ЗО", "1_S1Jb4p9GhYAIweKj4HRCyikpLe1uWvz"],
    ["operations", "S", "Порядок подання запитів на публічну інформацію, контакти та оскарження", "1oC_sXR9Q5e2W1D7Llg0pm_WWWFw9leUB"],

    ["hr", "S", "Інформація про вакантні посади ЗО та проведення конкурсу", "17thnwhFq0LEi2X5MCxOaCFQQs-PXgMAS"],
    ["hr", "S", "Кадровий склад закладу освіти згідно з ліцензійними умовами", "1t6PSEHJge5AbO-U9B4esnvnf1JnD37u9"],
    ["hr", "R", "Щорічне оцінювання науково-педагогічних і педагогічних працівників ЗВО", "15vxlql-z-17jHp5n4Yx3_Jh3SGNO459q"],
    ["hr", "R", "Штатний розпис", "1MldnwizHSshGFfL2k6VFwbrzl-FEAny2"],

    ["education", "R", "Щорічне оцінювання здобувачів ЗВО", "1zOfV1TYXyi0O_t9qeopkR7xabVVizJGe"],
    ["education", "S", "Чинні політики і процедури внутрішнього забезпечення якості вищої освіти", "1_kcty2VN3XpoUdhEYqlEXGku83rbSPiK"],
    ["education", "R", "Сертифікати про акредитацію", "1_WXOsJSHyQK0cCAsaL7jgmJMMRP94Nrn"],
    ["education", "S", "Матеріали акредитаційних справ та повідомлення про відкриті зустрічі", "1m0uCwgk_nipwRZ3ShK8DbuS-1bjN3EgI"],
    ["education", "M", "Освітні програми та перелік освітніх компонентів", "1KGrgZ1p_6Ml-0JJwjmGmSokLxeUsnDa-"],
    ["education", "S", "Умови доступності закладу освіти для навчання осіб з особливими освітніми потребами", "1x5jqjz14wxwhGxj9ars7Heuat2uoYI8t"],
    ["education", "S", "Мова (мови) освітнього процесу", "1fu6dU9NaD_Y752WY3tgaxiAcbIwtBejF"],
    ["education", "S", "Документи закладу, якими регулюється освітній процес", "1ksLZgUHiwdJJIJZkjiCMWdIUGplKrlbf"],
    ["education", "S", "Кодекс і процедури академічної доброчесності", "1-prk4zm3c5l3nnQZ78Zug7qzirH__Su_"],
    ["education", "R", "Результати моніторингу якості освіти", "1kS8oDI64ayRuQl7WQUxWAJ8Ud9qiHy8H"],
    ["education", "R", "Навчальні плани, робочі програми дисциплін і відомості про індивідуальну освітню траєкторію", "1JQ2tpXfscBWoepSdQ-V-0p4jwE4MWRJt"],
  ];

  // Статус актуальності з «Звіт по документах» (аудит 26.10.2026). Ключ — початок назви.
  // ok — Оновлений, stale — Застарілий, broken — Посилання не працює
  const audit = {
    "Головна сторінка офіційного": { status: "ok" },
    "Статут ЗО": { status: "stale", owner: "Юдін" },
    "Склад керівних органів": { status: "broken", owner: "готує команда" },
    "Структура та органи управління": { status: "broken", owner: "готує команда" },
    "Ліцензії на провадження": { status: "ok" },
    "Ліцензований обсяг та фактична": { status: "ok" },
    "Освітні програми": { status: "ok" },
    "Сертифікати про акредитацію": { status: "stale", owner: "Вячеслав" },
    "Документи закладу, якими": { status: "stale", owner: "Юдін" },
    "Напрями наукової": { status: "stale", owner: "Сердюк" },
    "Річний звіт про діяльність закладу": { status: "broken", owner: "на основі звіту борда" },
    "Кошторис закладу": { status: "stale", owner: "Берзеніна" },
    "Звіт про використання та надходження": { status: "stale", owner: "Берзеніна" },
  };

  // Строки регулярних документів з листа «Регулярні — строки» (від 09.11.2026).
  // due — останній день вікна «Найближче оновлення»; label — як записано в таблиці.
  const schedule = {
    "Ліцензований обсяг та фактична": { cycle: "Щороку", due: "2026-11-30", label: "Листопад 2026 (контингент 2026/27)" },
    "Сертифікати про акредитацію": { cycle: "Кожні 5 років на кожну ОП", due: null, label: "Для кожної ОП своя дата — потрібен перелік строків" },
    "Річний звіт про діяльність закладу": { cycle: "Щороку", due: "2027-03-31", label: "I квартал 2027 (звіт за 2026)" },
    "Кошторис закладу": { cycle: "Щороку + кожна зміна", due: "2027-01-31", label: "Січень 2027 (кошторис 2027)" },
    "Звіт про використання та надходження": { cycle: "Щороку", due: "2027-03-31", label: "Березень 2027 (звіт за 2026)" },
    "Штатний розпис": { cycle: "Щороку + зміни", due: "2027-01-31", label: "Січень 2027" },
    "Результати моніторингу якості": { cycle: "Щороку", due: "2027-09-30", label: "Липень–вересень 2027 (за 2026/27)" },
    "Щорічне оцінювання здобувачів": { cycle: "Щороку", due: "2027-09-30", label: "Липень–вересень 2027" },
    "Щорічне оцінювання науково-педагогічних": { cycle: "Щороку", due: "2027-09-30", label: "Липень–вересень 2027" },
    "Відомості про гуртожитки": { cycle: "Щороку", due: "2027-06-30", label: "Червень 2027" },
    "Правила прийому": { cycle: "Щороку", due: "2027-04-30", label: "Березень–квітень 2027" },
    "Вичерпний перелік освітніх програм": { cycle: "Щороку", due: "2027-04-30", label: "Березень–квітень 2027" },
    "Відомості про Приймальну комісію": { cycle: "Щороку", due: "2027-02-28", label: "Початок 2027" },
    "Програми вступних іспитів": { cycle: "Щороку", due: "2027-04-30", label: "Березень–квітень 2027" },
    "Розмір плати за навчання": { cycle: "Щороку", due: "2027-05-31", label: "Весна 2027 (вартість 2027/28)" },
  };

  const find = (map, title) => {
    const key = Object.keys(map).find((k) => title.startsWith(k));
    return key ? map[key] : null;
  };

  const documents = raw.map(([section, type, title, folder], i) => {
    const a = find(audit, title);
    const s = type === "R" ? find(schedule, title) : null;
    return {
      id: "d" + (i + 1),
      section,
      type,
      title,
      url: "https://drive.google.com/drive/folders/" + folder,
      status: a ? a.status : "unknown",
      owner: a && a.owner ? a.owner : null,
      cycle: s ? s.cycle : null,
      due: s ? s.due : null,
      dueLabel: s ? s.label : null,
    };
  });

  return {
    today: TODAY,
    sections: sections.map((s) => ({ ...s, url: "https://drive.google.com/drive/folders/" + s.folder })),
    documents,
    sources: {
      root: "https://drive.google.com/drive/folders/1awFZGigqGekfTfcXr-9xR_Akbq0k9wCj",
      report: "https://docs.google.com/spreadsheets/d/15j921px4mPbQ0uVL1_bbc4HyBvSd2qnWwSo3hwcye18/edit",
      periods: "https://docs.google.com/spreadsheets/d/1my11xA8bGr8ckBxJ6zRrHt55bAfARtjU1ibsv-8aGgI/edit",
    },
  };
})();
