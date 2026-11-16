import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMatcher, cleanPeriod, columnLetter, normalizeName, parseDueDate, parseFolderName, resolveStatus, statusFromLabel,
} from "../src/parse.js";

test("parseFolderName splits name and update type", () => {
  assert.deepEqual(
    { ...parseFolderName("Бюджет закладу освіти [Регулярний]"), type: parseFolderName("Бюджет закладу освіти [Регулярний]").type.key },
    { name: "Бюджет закладу освіти", typeLabel: "Регулярний", type: "regular" },
  );
  assert.equal(parseFolderName("Щось [Стихійний]").type.key, "ad_hoc");
  assert.equal(parseFolderName("Щось [Змішаний]").type.key, "mixed");
  assert.equal(parseFolderName('Інформація з обмеженим доступом. (не застосовується згідно ч. 1 ст. 79 ЗУ "Про вищу освіту" [Не застосовується]').type.key, "not_applicable");
  // Brackets inside the name don't confuse it; only the trailing [..] counts.
  assert.equal(parseFolderName("Мова (мови) [x] освіти [Регулярний]").name, "Мова (мови) [x] освіти");
  const none = parseFolderName("Без типу");
  assert.equal(none.type, null);
  assert.equal(none.name, "Без типу");
});

test("normalizeName unifies apostrophes, quotes, whitespace and trailing dots", () => {
  assert.equal(normalizeName("суб’єкта"), normalizeName("суб'єкта"));
  assert.equal(normalizeName("перелік\nосвітніх  компонентів"), "перелік освітніх компонентів");
  assert.equal(normalizeName("від 04.10.2024)."), "від 04.10.2024)");
  assert.equal(normalizeName("«Про освіту»"), normalizeName('"Про освіту"'));
});

test("buildMatcher: exact first, fuzzy only when unambiguous", () => {
  const rows = ["Бюджет закладу освіти", "Кошторис закладу та всі зміни до нього", "Штатний розпис"];
  const match = buildMatcher(rows, (r) => r);
  assert.equal(match("бюджет  закладу освіти").how, "exact");
  assert.equal(match("Кошторис закладу та всі зміни до нього.").row, rows[1]);
  assert.equal(match("Зовсім інший документ"), null);
});

test("status labels map to keys, tolerating variants", () => {
  assert.equal(statusFromLabel("Оновлений").key, "up_to_date");
  assert.equal(statusFromLabel("Застарілий").key, "outdated");
  assert.equal(statusFromLabel("Зміна сайту - посилання не працює").key, "broken_link");
  assert.equal(statusFromLabel("Зміна сайту – посилання не працює").key, "broken_link");
  assert.equal(statusFromLabel("Відсутній").key, "missing");
  assert.equal(statusFromLabel("На розгляді").key, "under_review");
  assert.equal(statusFromLabel("Додано під час аудиту"), null);
  assert.equal(resolveStatus("outdated").label, "Застарілий");
  assert.equal(resolveStatus("Оновлений").key, "up_to_date");
  assert.equal(resolveStatus("nonsense"), null);
  assert.equal(resolveStatus(42), null);
});

test("cleanPeriod", () => {
  assert.equal(cleanPeriod("—"), null);
  assert.equal(cleanPeriod(""), null);
  assert.equal(cleanPeriod("Рейтинги —\nщосеместру"), "Рейтинги — щосеместру");
});

test("parseDueDate handles every format used in «Регулярні — строки»", () => {
  const cases = {
    "Листопад 2026 (контингент\n2026/27)": "2026-11-30",
    "I квартал 2027 (звіт за\n2026)": "2027-03-31",
    "Січень 2027 (кошторис 2027)": "2027-01-31",
    "Березень 2027 (звіт за 2026)": "2027-03-31",
    "Липень–вересень 2027 (за\n2026/27)": "2027-09-30",
    "Червень 2027": "2027-06-30",
    "Березень–квітень 2027\n(залежить від дати Порядку\nприйому 2027)": "2027-04-30",
    "Початок 2027": "2027-02-28",
    "Весна 2027 (вартість\n2027/28)": "2027-05-31",
    "Липень–серпень 2027": "2027-08-31",
    "Серпень–жовтень 2027": "2027-10-31",
    "До 1 вересня 2027 (на\n2027/28)": "2027-09-01",
    "Для кожної ОП своя дата —\nскласти перелік строків\nсертифікатів": null,
    "Перевірити дату закінчення\nпоточного свідоцтва": null,
    "": null,
  };
  for (const [text, want] of Object.entries(cases)) assert.equal(parseDueDate(text), want, text);
  assert.equal(parseDueDate("Лютий 2028"), "2028-02-29"); // leap year
});

test("columnLetter", () => {
  assert.equal(columnLetter(0), "A");
  assert.equal(columnLetter(3), "D");
  assert.equal(columnLetter(25), "Z");
  assert.equal(columnLetter(26), "AA");
  assert.equal(columnLetter(27), "AB");
});
