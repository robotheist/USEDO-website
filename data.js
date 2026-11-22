// Публічна версія: розділи, групи й документи з посиланнями на Google Drive.
// Джерело: Процеси → ЄДЕБО та Ліцензування → Оновлення публічної інформації → Документи (знімок 23.11.2026).
// Розділ = папка в «Документи». Документ = папка всередині розділу.
// Група = папка, у якій лежать інші папки (наприклад «Протидія булінгу»): її документи показано під заголовком.
// photo — обкладинка картки розділу; порожнє значення дає фірмовий градієнт.

window.PORTAL_DATA = (() => {
  const folder = (id) => "https://drive.google.com/drive/folders/" + id;

  // [назва, id папки]  або  [назва групи, id папки, [документи]]
  const sections = [
    { id: "upbringing", name: "Виховні процеси", folder: "1ki5xIVDrzS8FUBgYRPzPg1KE9TUVOf0x",
      about: "Студентський розвиток, протидія булінгу й харасменту, правила поведінки та проживання в колівінгах",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/19143011/91cb4a61-cab5-4d01-b9ba-e30b879bda53-768x432.webp",
      items: [
        ["Відомості про гуртожитки, вільні місця, розмір плати за проживання", "1F2bJPRJhgb2bFN4T6QHxtmKEwAvjAcg_"],
        ["План заходів по студентському розвитку", "1l0cEQ5osh-mJoLNENQ6-EBZVCQg2AusB"],
        ["Політика Програми Honors", "1yHOObClOIpL5ZiQYiglEODJtSdQAr-IO"],
        ["Правила поведінки здобувача освіти в закладі освіти", "1rtridJqpb7EtzVby23Dcnaf5VG_nk96x"],
        ["Правила проживання в колівінгах", "191GfLjGxxMxoAJO1a6u4atNR15hyjKM_"],
        ["Протидія харасменту", "1BqfKlWxmjOsFNeL8vMx-oSbI8IjhVJiO"],
        ["Протидія булінгу", "1SMFQzhoPa6_BU1tPrWyHnT1b282Ktsek", [
          ["План заходів, спрямованих на запобігання та протидію булінгу (цькуванню) в закладі освіти", "1f-9wxtdW03cRXzFo8AobvrI0up1JIRqJ"],
          ["Порядок подання та розгляду (з дотриманням конфіденційності) заяв про випадки булінгу (цькування) в закладі освіти", "16HhXu18Yi5M0655d4isGpEk2tEvFWkWP"],
          ["Порядок реагування на доведені випадки булінгу (цькування) в закладі освіти та відповідальність осіб, причетних до булінгу (цькування)", "13HCKNbcE42NYARl9MM_CrtNOGOw63POC"],
          ["Положення про запобігання і протидію насильству та жорстокому поводженню з дітьми", "1Af-8DTRdrDJ7jkvMTDO0JnNrKpD562rG"],
        ]],
      ] },
    { id: "admission", name: "Вступна кампанія", folder: "1tl_bX0FQ1G-l9n4ARQ079k2cCeoOWrQ9",
      about: "Правила прийому, гайд для вступника, програми вступних випробувань, рейтингові списки та накази про зарахування",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/05164226/media-768x576.webp",
      items: [
        ["Відомості про Приймальну комісію", "1jaXvBANWNAUCSrNHovkwvZKXSzstybMu"],
        ["Гайд для вступника", "1gzSlaiMQwzT7I3KPXJbfyB0nmDHlsfyl"],
        ["Інформація про університет, правила прийому іноземців та осіб без громадянства, умови навчання та проживання іноземців та осіб без громадянства (англійською)", "1h46RBjdpC9QNrC3Jku3e5zb_cwj10hvt"],
        ["Перелік освітніх програм з розподілом ліцензованих обсягів, за якими планується здійснювати набір у відповідному році вступної кампанії", "11HSQGKZUWobtQ1bOww2WyzKvJOdnigC9"],
        ["Положення про надання підтримки", "1xtSVWXtnozqwthmBR3hHPC9RLgKSy1Dz"],
        ["Правила прийому до закладу освіти", "1d8SNJFSImeEd5vgAIolpNW9wxevTNTrm"],
        ["Програми вступних іспитів, фахових випробувань, співбесід тощо", "1VfrxUB4VyUdTgaWfV4hMnkCfN3fgk8JL"],
        ["Рейтингові списки вступників", "1fGbkbX6t2Xf38O9wfsDgoVcA0qou7Ovh"],
        ["Рішення приймальної комісії щодо надання рекомендацій на зарахування", "1L0KmNtdpYtqfHgnEpShGgpfXe8AkLfdB"],
        ["Списки зарахованих (накази про зарахування)", "1RIqqOMM6T09-PUTrcZQ7MEnFey0Tghqu"],
      ] },
    { id: "general", name: "Загальна інформація", folder: "1qN39e3veADPYPg3-DvLjprhvoudPL6vU",
      about: "Статут, управління університетом, ліцензійні умови, нормативні документи та порядок запитів на публічну інформацію",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/20133803/e64946fe-3323-49c9-938e-b4191e35096d-768x403.webp",
      items: [
        ["Інша інформація, що оприлюднюється за рішенням закладу освіти або на вимогу законодавства", "1ZT5F8dRSSI0-czUn6WrRAekiGad9Q72P"],
        ["Порядок подання запитів на публічну інформацію, контакти та оскарження", "1oC_sXR9Q5e2W1D7Llg0pm_WWWFw9leUB"],
        ["Публічні пропозиції", "10gxAy97za2QfGLKeqZYEswy5kDF_Ie4r"],
        ["Статут ЗО (установчі документи)", "1ai2GVeHP6VMh5GEdOnryTkyO_aXx7ju0"],
        ["Ліцензійні умови", "1dS0EY-QoDWdG9XOeFtpe00AmDyCBzRH_", [
          ["Ліцензії на провадження освітньої діяльності", "10geX3bSF8WwSjJw3C_rdh0_wHqLo_ZA3"],
          ["Ліцензований обсяг та фактична кількість осіб, які навчаються в ЗО", "1_S1Jb4p9GhYAIweKj4HRCyikpLe1uWvz"],
          ["Матеріально-технічне забезпечення закладу освіти (згідно з ліцензійними умовами)", "18OW3RsvdTNnL67AF-oTmQmAAey3o0uwR"],
          ["Перелік професій, за якими здійснюється підготовка у закладі освіти", "17fcJqW9Ow5mTJGUmDI8ItRfZt7Hf5FKJ"],
          ["Свідоцтва про атестацію закладу професійної (професійно-технічної) освіти", "1afhGTQ_JGwFsgStCJJL5Doaz33bXODzf"],
        ]],
        ["Нормативні документи", "1_o2XvRq0haH0QtqadX6r2eKjcMkeTsuD", [
          ["Ветеранська політика", "1lPDaZVUkmOl7AAjO1ae1NlVUlslQrlNL"],
          ["План гендерної рівності", "1Hmzpf4Fu69zd4mHxkPmtklxPTZ2a4WLF"],
          ["Регламент Сенату (Вченої ради)", "1raYOP0g0VYnwUkc_iDUb5ZEHlV5moTby"],
        ]],
        ["Управління університетом", "10iTMh9MK-wWhVkaCGjfr-zyPW-NlSJxX", [
          ["Склад керівних органів", "1ez3q83fbSsP36UqCfMCvfvYrhlBjG8v-"],
          ["Структура та органи управління закладу освіти", "1KN4jxBlU-sHh_5pk9PGMeAMIdMnpol2V"],
          ["Щорічний звіт про діяльність закладу освіти", "1gG6M33s38-KZifyQQWt5ILC3EUpfsqTW"],
          ["Щорічний звіт про діяльність керівника закладу освіти", "1f5jd7fOyHLoFbcdTez8yFr1lGh9s2SWi"],
        ]],
      ] },
    { id: "hr", name: "Кадрові питання", folder: "1SfCjiNsXV_vNvt5swK_iXDGJsgiPWqUh",
      about: "Кадровий склад, вакансії й конкурсний відбір, вчені звання та правила внутрішнього розпорядку",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/08/27151143/794eb48f012f0b282a4761169c704d2db8180455-1-768x432.webp",
      items: [
        ["Інформація про вакантні посади ЗО та проведення конкурсу", "17thnwhFq0LEi2X5MCxOaCFQQs-PXgMAS"],
        ["Кадровий склад закладу освіти згідно з ліцензійними умовами", "1t6PSEHJge5AbO-U9B4esnvnf1JnD37u9"],
        ["Положення про визнання іноземних документів про освіту та наукових звань", "1sAQi-qzY6oSr7cajNqoxXXdhkky84R7c"],
        ["Порядок присвоєння вчених звань", "1w5FYy8rmtL4CseZd605XnkKORMaJRYEC"],
        ["Порядок проведення конкурсу", "1fEyE1Gn0lkEwjcDCIB35d94plOMUSUyK"],
        ["Правила внутрішнього розпорядку", "1gJS-Zx_jUf9h8ZPuoFg7o0poC3Uuj2QN"],
        ["Штатний розпис", "1MldnwizHSshGFfL2k6VFwbrzl-FEAny2"],
      ] },
    { id: "science", name: "Наука та аспірантура", folder: "1poHFf2abS5BzReTU5baHTk6kNGsi7ozD",
      about: "Напрями наукової діяльності, аспірантура, захисти дисертацій, наукові лабораторії та бібліотека",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/20101037/3c5170bf-82aa-44d0-8711-97e05db784f0-768x512.webp",
      items: [
        ["Бібліотека", "14bLzkRTIEqYUnfYIALsCRw09XspIawi1"],
        ["Матеріали захистів PhD, разові ради та трансляція атестації", "1tpgHtTtijrsJa6GkpJwRo4SrOpWjiezD"],
        ["Напрями наукової діяльності", "1gPYuuvEz4mlj3NYh9lkjcugPVoYCXY8j"],
        ["Наукові лабораторії", "1YEgCVDGsYKsB4wg-UKxDReR3LBGOH2bq"],
        ["Положення про навчання в аспірантурі", "1MwbxFXxaK07-9R9SlHnbm8k_9e1mvilr"],
        ["Порядок проведення захисту дисертацій", "1n90kstLjNuSYvc9GvMTX9URYqSXH4-2A"],
      ] },
    { id: "education", name: "Освітній процес", folder: "1zy_94kC2rZUt9oBdIRESCAd3hEgnmAjJ",
      about: "Освітні програми й навчальні плани, академічна доброчесність, мобільність і політики щодо вибіркових дисциплін та ШІ",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/18094523/21b4ff7b-72a8-439e-bd35-bb3c93c84e35-768x576.webp",
      items: [
        ["Кодекс академічної доброчесності", "1-prk4zm3c5l3nnQZ78Zug7qzirH__Su_"],
        ["Мова (мови) освітнього процесу", "1fu6dU9NaD_Y752WY3tgaxiAcbIwtBejF"],
        ["Навчальні плани, робочі програми дисциплін і відомості про індивідуальну освітню траєкторію", "1JQ2tpXfscBWoepSdQ-V-0p4jwE4MWRJt"],
        ["Освітні програми, що реалізуються в закладі освіти, та перелік освітніх компонентів, що передбачені відповідною освітньою програмою", "1KGrgZ1p_6Ml-0JJwjmGmSokLxeUsnDa-"],
        ["Політика використання штучного інтелекту", "1BN0m3K-kg2-XreHB7jtEI4wqFSGNBWJ1"],
        ["Політика щодо вибіркових дисциплін", "1qQUZwxxovTKMSyaGbbHGIJ8tqji5c6Cw"],
        ["Положення про визнання результатів навчання", "151yZGlW2hq6d-oj1gA3DZqgKU_2MBlcj"],
        ["Положення про міжнародну академічну мобільність", "1J9JCI7rpSOHZ8Mu46dgKId-9D9U0nrrA"],
        ["Умови доступності закладу освіти для навчання осіб з особливими освітніми потребами", "1x5jqjz14wxwhGxj9ars7Heuat2uoYI8t"],
        ["Положення про організацію освітнього процесу", "1ksLZgUHiwdJJIJZkjiCMWdIUGplKrlbf", [
          ["Положення про освітній процес", "1s7cPnRjQhGQNIggWJvtVoRWp83vKTlFz"],
        ]],
      ] },
    { id: "selfgov", name: "Студентське самоврядування", folder: "1s7jEq5uqQUsscExWf6yJwXNQDBDefVun",
      about: "Положення про студентське самоврядування, вибори та склад органів самоврядування",
      photo: "",
      items: [
        ["Положення про вибори", "16jFUmNqRbv5Dl6hjel7j8jsLwoEMc2qD"],
        ["Положення про студентське самоврядування", "1kefKX41Z_GKHI8JB9cOBB9EbE35sF3if"],
        ["Склад студентського самоврядування", "1dq8-rSBRidWcOZQIGlNONQaM6PjMKi-f"],
      ] },
    { id: "finance", name: "Фінансові питання", folder: "1UNHcdzfJ4f6I66pjfvTnkgoH1pA-Sox5",
      about: "Бюджет і кошторис університету, вартість навчання й послуг, стипендії, тендери та благодійна допомога",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/10/27140254/a3049190-4bf2-4a95-b5bf-7b096d9fc845-768x432.webp",
      items: [
        ["Бюджет закладу освіти", "1zZebMjToE7DejjQwUEMAxJd4012Yjmbp"],
        ["Звіт про використання та надходження коштів", "1Yn37LIwOVh_kTxuc7UYP0z_QRi__lW5B"],
        ["Інформація про перелік товарів, робіт і послуг, отриманих як благодійна допомога, із зазначенням їх вартості, а також про кошти, отримані з інших джерел, не заборонених законодавством", "1QZ-9iGWHEGKBgPt68pcYlmZiusGA5zog"],
        ["Інформація про проведення тендерних процедур", "1mKEcD6Av6BeX_uY0XDMe2nHatXlamHgu"],
        ["Кошторис закладу та всі зміни до нього", "13UScQsBBcQ9Pr-K1ISzYO-64fyr9VNeR"],
        ["Перелік додаткових освітніх та інших послуг, їх вартість, порядок надання та оплати", "1cf7_6hpfHEuvOV1dfUpLDiltgdzOD6jL"],
        ["Правила призначення академічних стипендій та актуальні рейтинги", "1QctUEdij1x2bQN64AHbWS3JLQIUqcjLH"],
        ["Розмір плати за навчання, підготовку, перепідготовку, підвищення кваліфікації здобувачів освіти", "1k_8P-cksu2NvwIAnk5CcL5FYjDjZRgST"],
        ["Фінансовий звіт про надходження та використання всіх отриманих коштів", "1PfuDOKPJ05C2NJJy_vPAl1J_kewkikhu"],
      ] },
    { id: "quality", name: "Якість освіти", folder: "1H5Rdpqg0ne1IUDqUeywSoLUlq265QM1o",
      about: "Акредитація, внутрішнє забезпечення якості, моніторинг та щорічне оцінювання студентів і викладачів",
      photo: "https://kse.ua/kse-media/wp-content/uploads/2026/11/06085146/kse-og-default-1200x630-1.jpg",
      items: [
        ["Матеріали акредитаційних справ та повідомлення про відкриті зустрічі", "1m0uCwgk_nipwRZ3ShK8DbuS-1bjN3EgI"],
        ["Політики і процедури внутрішнього забезпечення якості вищої освіти", "1_kcty2VN3XpoUdhEYqlEXGku83rbSPiK"],
        ["Результати моніторингу якості освіти", "1kS8oDI64ayRuQl7WQUxWAJ8Ud9qiHy8H"],
        ["Сертифікати про акредитацію", "1_WXOsJSHyQK0cCAsaL7jgmJMMRP94Nrn"],
        ["Щорічне оцінювання здобувачів ЗВО", "1zOfV1TYXyi0O_t9qeopkR7xabVVizJGe"],
        ["Щорічне оцінювання науково-педагогічних і педагогічних працівників ЗВО", "15vxlql-z-17jHp5n4Yx3_Jh3SGNO459q"],
      ] },
  ];

  const documents = [];
  const out = sections.map(({ items, ...s }) => {
    const doc = (title, id, group) => { const d = { id: "d" + (documents.length + 1), section: s.id, group, title, url: folder(id) }; documents.push(d); return d; };
    const docs = [], groups = [];
    for (const [title, id, children] of items) {
      if (children) groups.push({ name: title, url: folder(id), docs: children.map(([t, cid]) => doc(t, cid, title)) });
      else docs.push(doc(title, id, null));
    }
    return { ...s, url: folder(s.folder), docs, groups };
  });

  return { sections: out, documents, root: folder("1awFZGigqGekfTfcXr-9xR_Akbq0k9wCj") };
})();
