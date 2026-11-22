// Публічна версія: лише розділи і документи з посиланнями на Google Drive.
// Джерело: Процеси → ЄДЕБО та Ліцензування → Оновлення публічної інформації → Документи (знімок 16.11.2026).
// photo — обкладинка картки розділу; порожнє значення дає фірмовий градієнт.

window.PORTAL_DATA = (() => {
  const folder = (id) => "https://drive.google.com/drive/folders/" + id;

  const sections = [
    { id: "admission", name: "Вступна кампанія", folder: "1tl_bX0FQ1G-l9n4ARQ079k2cCeoOWrQ9",
      about: "Правила прийому, програми вступних випробувань, рейтингові списки та накази про зарахування",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/05164226/media-768x576.webp" },
    { id: "finance", name: "Фінансові питання", folder: "1UNHcdzfJ4f6I66pjfvTnkgoH1pA-Sox5",
      about: "Бюджет і кошторис університету, вартість послуг, стипендії та благодійна допомога",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/10/27140254/a3049190-4bf2-4a95-b5bf-7b096d9fc845-768x432.webp" },
    { id: "education", name: "Освітній процес", folder: "1zy_94kC2rZUt9oBdIRESCAd3hEgnmAjJ",
      about: "Освітні програми, навчальні плани, розклад, правила оцінювання та атестації",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/18094523/21b4ff7b-72a8-439e-bd35-bb3c93c84e35-768x576.webp" },
    { id: "operations", name: "Операційні питання", folder: "1H5Rdpqg0ne1IUDqUeywSoLUlq265QM1o",
      about: "Ліцензії, акредитація, матеріально-технічна база та структура університету",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/06085146/kse-og-default-1200x630-1.jpg" },
    { id: "policies", name: "Загальні політики", folder: "1qN39e3veADPYPg3-DvLjprhvoudPL6vU",
      about: "Статут, стратегія розвитку, положення та політики, що регулюють життя університету",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/20133803/e64946fe-3323-49c9-938e-b4191e35096d-768x403.webp" },
    { id: "hr", name: "Кадрові питання", folder: "1SfCjiNsXV_vNvt5swK_iXDGJsgiPWqUh",
      about: "Кадровий склад, вакансії, конкурсний відбір та підвищення кваліфікації викладачів",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/08/27151143/794eb48f012f0b282a4761169c704d2db8180455-1-768x432.webp" },
    { id: "upbringing", name: "Виховні процеси", folder: "1ki5xIVDrzS8FUBgYRPzPg1KE9TUVOf0x",
      about: "Виховна робота, протидія булінгу, психологічна підтримка та безпечне освітнє середовище",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/19143011/91cb4a61-cab5-4d01-b9ba-e30b879bda53-768x432.webp" },
    { id: "science", name: "Наука та аспірантура", folder: "1poHFf2abS5BzReTU5baHTk6kNGsi7ozD",
      about: "Наукова діяльність, аспірантура, захисти дисертацій та дослідницькі проєкти",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/20101037/3c5170bf-82aa-44d0-8711-97e05db784f0-768x512.webp" },
    { id: "selfgov", name: "Студентське самоврядування", folder: "1s7jEq5uqQUsscExWf6yJwXNQDBDefVun",
      about: "Органи студентського самоврядування, їхні положення, склад і рішення",
      photo: "" },
  ];

  // [розділ, назва документа, id папки в Drive]
  const raw = [
    ["admission", "Відомості про Приймальну комісію ЗВО та визначення повноважень у встановленому законодавством порядку", "1jaXvBANWNAUCSrNHovkwvZKXSzstybMu"],
    ["admission", "Списки зарахованих (накази про зарахування)", "1RIqqOMM6T09-PUTrcZQ7MEnFey0Tghqu"],
    ["admission", "Рішення приймальної комісії щодо надання рекомендацій на зарахування", "1L0KmNtdpYtqfHgnEpShGgpfXe8AkLfdB"],
    ["admission", "Правила прийому до закладу освіти", "1d8SNJFSImeEd5vgAIolpNW9wxevTNTrm"],
    ["admission", "Сторінка англійською мовою з основною інформацією, правилами прийому та умовами навчання іноземців", "1h46RBjdpC9QNrC3Jku3e5zb_cwj10hvt"],
    ["admission", "Програми вступних іспитів, фахових випробувань, співбесід тощо", "1VfrxUB4VyUdTgaWfV4hMnkCfN3fgk8JL"],
    ["admission", "Рейтингові списки вступників", "1fGbkbX6t2Xf38O9wfsDgoVcA0qou7Ovh"],
    ["admission", "Вичерпний перелік освітніх програм з розподілом ліцензованих обсягів для набору у відповідному році", "11HSQGKZUWobtQ1bOww2WyzKvJOdnigC9"],

    ["finance", "Бюджет закладу освіти", "1zZebMjToE7DejjQwUEMAxJd4012Yjmbp"],
    ["finance", "Інформація про проведення тендерних процедур", "1mKEcD6Av6BeX_uY0XDMe2nHatXlamHgu"],
    ["finance", "Перелік додаткових освітніх та інших послуг, їх вартість, порядок надання та оплати", "1cf7_6hpfHEuvOV1dfUpLDiltgdzOD6jL"],
    ["finance", "Інформація про благодійну допомогу та кошти, отримані з інших джерел", "1QZ-9iGWHEGKBgPt68pcYlmZiusGA5zog"],
    ["finance", "Правила призначення академічних стипендій та актуальні рейтинги", "1QctUEdij1x2bQN64AHbWS3JLQIUqcjLH"],
    ["finance", "Кошторис закладу та всі зміни до нього", "13UScQsBBcQ9Pr-K1ISzYO-64fyr9VNeR"],
    ["finance", "Розмір плати за навчання, підготовку, перепідготовку, підвищення кваліфікації", "1k_8P-cksu2NvwIAnk5CcL5FYjDjZRgST"],
    ["finance", "Звіт про використання та надходження коштів", "1Yn37LIwOVh_kTxuc7UYP0z_QRi__lW5B"],
    ["finance", "Фінансовий звіт про надходження та використання всіх отриманих коштів", "1PfuDOKPJ05C2NJJy_vPAl1J_kewkikhu"],

    ["upbringing", "Відомості про гуртожитки, вільні місця, розмір плати за проживання", "1F2bJPRJhgb2bFN4T6QHxtmKEwAvjAcg_"],
    ["upbringing", "Положення про запобігання і протидію насильству та жорстокому поводженню з дітьми", "1Af-8DTRdrDJ7jkvMTDO0JnNrKpD562rG"],
    ["upbringing", "Порядок подання та розгляду заяв про випадки булінгу (цькування)", "16HhXu18Yi5M0655d4isGpEk2tEvFWkWP"],
    ["upbringing", "План заходів, спрямованих на запобігання та протидію булінгу (цькуванню)", "1f-9wxtdW03cRXzFo8AobvrI0up1JIRqJ"],
    ["upbringing", "Правила поведінки здобувача освіти в закладі освіти", "1rtridJqpb7EtzVby23Dcnaf5VG_nk96x"],
    ["upbringing", "Порядок реагування на доведені випадки булінгу та відповідальність причетних осіб", "13HCKNbcE42NYARl9MM_CrtNOGOw63POC"],

    ["science", "Матеріали захистів PhD, разові ради та трансляція атестації", "1tpgHtTtijrsJa6GkpJwRo4SrOpWjiezD"],
    ["science", "Напрями наукової та/або мистецької діяльності", "1gPYuuvEz4mlj3NYh9lkjcugPVoYCXY8j"],

    ["policies", "Річний звіт про діяльність закладу освіти", "1gG6M33s38-KZifyQQWt5ILC3EUpfsqTW"],
    ["policies", "Структура та органи управління закладу освіти", "1KN4jxBlU-sHh_5pk9PGMeAMIdMnpol2V"],
    ["policies", "Цільові показники діяльності керівника, строки та спосіб перевірки їх досягнення", "1njxsyVHHFwMG44Do7ZH1WFmAC4B9rucc"],
    ["policies", "Інша інформація, що оприлюднюється за рішенням закладу або на вимогу законодавства", "1ZT5F8dRSSI0-czUn6WrRAekiGad9Q72P"],
    ["policies", "Склад керівних органів", "1ez3q83fbSsP36UqCfMCvfvYrhlBjG8v-"],
    ["policies", "Статут ЗО (установчі документи)", "1ai2GVeHP6VMh5GEdOnryTkyO_aXx7ju0"],
    ["policies", "Інформація з обмеженим доступом (не застосовується згідно ч. 1 ст. 79 ЗУ «Про вищу освіту»)", "1BpPGg2M1CHo6VuJuiwIqjoCT6hOUFZGo"],
    ["policies", "Щорічний звіт про діяльність керівника закладу освіти", "1f5jd7fOyHLoFbcdTez8yFr1lGh9s2SWi"],

    ["operations", "Свідоцтва про атестацію закладу професійної (професійно-технічної) освіти", "1afhGTQ_JGwFsgStCJJL5Doaz33bXODzf"],
    ["operations", "Матеріально-технічне забезпечення закладу освіти (згідно з ліцензійними умовами)", "18OW3RsvdTNnL67AF-oTmQmAAey3o0uwR"],
    ["operations", "Ліцензії на провадження освітньої діяльності", "10geX3bSF8WwSjJw3C_rdh0_wHqLo_ZA3"],
    ["operations", "Державна атестація закладів ПТО за старими правилами (втратила чинність, ПКМУ № 1146)", "1XblbUsWntC04WzQH1LZ93vgP2jWJLy70"],
    ["operations", "Головна сторінка офіційного веб-сайту ЗВО", "1XzF5SIXcXiJtp5CT0FLNqCB6SYr-aYJR"],
    ["operations", "Перелік професій, за якими здійснюється підготовка у закладі освіти", "17fcJqW9Ow5mTJGUmDI8ItRfZt7Hf5FKJ"],
    ["operations", "Ліцензований обсяг закладу фахової передвищої освіти за кожною спеціальністю", "111scjO-MVUEk8lC3-Me3bsSDDeXYh3i_"],
    ["operations", "Ліцензований обсяг та фактична кількість осіб, які навчаються в ЗО", "1_S1Jb4p9GhYAIweKj4HRCyikpLe1uWvz"],
    ["operations", "Порядок подання запитів на публічну інформацію, контакти та оскарження", "1oC_sXR9Q5e2W1D7Llg0pm_WWWFw9leUB"],

    ["hr", "Інформація про вакантні посади ЗО та проведення конкурсу", "17thnwhFq0LEi2X5MCxOaCFQQs-PXgMAS"],
    ["hr", "Кадровий склад закладу освіти згідно з ліцензійними умовами", "1t6PSEHJge5AbO-U9B4esnvnf1JnD37u9"],
    ["hr", "Щорічне оцінювання науково-педагогічних і педагогічних працівників ЗВО", "15vxlql-z-17jHp5n4Yx3_Jh3SGNO459q"],
    ["hr", "Штатний розпис", "1MldnwizHSshGFfL2k6VFwbrzl-FEAny2"],

    ["education", "Щорічне оцінювання здобувачів ЗВО", "1zOfV1TYXyi0O_t9qeopkR7xabVVizJGe"],
    ["education", "Чинні політики і процедури внутрішнього забезпечення якості вищої освіти", "1_kcty2VN3XpoUdhEYqlEXGku83rbSPiK"],
    ["education", "Сертифікати про акредитацію", "1_WXOsJSHyQK0cCAsaL7jgmJMMRP94Nrn"],
    ["education", "Матеріали акредитаційних справ та повідомлення про відкриті зустрічі", "1m0uCwgk_nipwRZ3ShK8DbuS-1bjN3EgI"],
    ["education", "Освітні програми та перелік освітніх компонентів", "1KGrgZ1p_6Ml-0JJwjmGmSokLxeUsnDa-"],
    ["education", "Умови доступності закладу освіти для навчання осіб з особливими освітніми потребами", "1x5jqjz14wxwhGxj9ars7Heuat2uoYI8t"],
    ["education", "Мова (мови) освітнього процесу", "1fu6dU9NaD_Y752WY3tgaxiAcbIwtBejF"],
    ["education", "Документи закладу, якими регулюється освітній процес", "1ksLZgUHiwdJJIJZkjiCMWdIUGplKrlbf"],
    ["education", "Кодекс і процедури академічної доброчесності", "1-prk4zm3c5l3nnQZ78Zug7qzirH__Su_"],
    ["education", "Результати моніторингу якості освіти", "1kS8oDI64ayRuQl7WQUxWAJ8Ud9qiHy8H"],
    ["education", "Навчальні плани, робочі програми дисциплін і відомості про індивідуальну освітню траєкторію", "1JQ2tpXfscBWoepSdQ-V-0p4jwE4MWRJt"],
  ];

  return {
    sections: sections.map((s) => ({ ...s, url: folder(s.folder) })),
    documents: raw.map(([section, title, id], i) => ({ id: "d" + (i + 1), section, title, url: folder(id) })),
    root: folder("1awFZGigqGekfTfcXr-9xR_Akbq0k9wCj"),
  };
})();
