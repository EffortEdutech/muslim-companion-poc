import { CollectionInfo, CollectionGroup } from './types';

// Master manifest of all 17 collections
// Matches MANIFEST.md exactly
export const COLLECTIONS: CollectionInfo[] = [
  // ── The 9 Canonical Books ─────────────────────────────────────────
  {
    slug: 'bukhari',
    filename: 'bukhari.json',
    group: 'the_9_books',
    displayName: 'Sahih al-Bukhari',
    arabicName: 'صحيح البخاري',
    author: 'Imam Muhammad al-Bukhari',
    shortName: 'Bukhari',
  },
  {
    slug: 'muslim',
    filename: 'muslim.json',
    group: 'the_9_books',
    displayName: 'Sahih Muslim',
    arabicName: 'صحيح مسلم',
    author: 'Imam Muslim ibn al-Hajjaj',
    shortName: 'Muslim',
  },
  {
    slug: 'abudawud',
    filename: 'abudawud.json',
    group: 'the_9_books',
    displayName: 'Sunan Abu Dawud',
    arabicName: 'سنن أبي داود',
    author: 'Abu Dawud al-Sijistani',
    shortName: 'Abu Dawud',
  },
  {
    slug: 'tirmidhi',
    filename: 'tirmidhi.json',
    group: 'the_9_books',
    displayName: 'Jami at-Tirmidhi',
    arabicName: 'جامع الترمذي',
    author: 'Imam al-Tirmidhi',
    shortName: 'Tirmidhi',
  },
  {
    slug: 'nasai',
    filename: 'nasai.json',
    group: 'the_9_books',
    displayName: "Sunan an-Nasa'i",
    arabicName: 'سنن النسائي',
    author: "Ahmad ibn Shu'ayb al-Nasa'i",
    shortName: "Nasa'i",
  },
  {
    slug: 'ibnmajah',
    filename: 'ibnmajah.json',
    group: 'the_9_books',
    displayName: 'Sunan Ibn Majah',
    arabicName: 'سنن ابن ماجه',
    author: 'Ibn Majah al-Qazwini',
    shortName: 'Ibn Majah',
  },
  {
    slug: 'ahmed',
    filename: 'ahmed.json',
    group: 'the_9_books',
    displayName: 'Musnad Ahmad',
    arabicName: 'مسند أحمد',
    author: 'Imam Ahmad ibn Hanbal',
    shortName: 'Ahmad',
  },
  {
    slug: 'malik',
    filename: 'malik.json',
    group: 'the_9_books',
    displayName: "Muwatta Imam Malik",
    arabicName: 'موطأ مالك',
    author: 'Imam Malik ibn Anas',
    shortName: 'Malik',
  },
  {
    slug: 'darimi',
    filename: 'darimi.json',
    group: 'the_9_books',
    displayName: 'Sunan al-Darimi',
    arabicName: 'سنن الدارمي',
    author: 'Abdullah ibn Abd al-Rahman al-Darimi',
    shortName: 'Darimi',
  },

  // ── Other Collections ─────────────────────────────────────────────
  {
    slug: 'riyad_assalihin',
    filename: 'riyad_assalihin.json',
    group: 'other_books',
    displayName: 'Riyad as-Salihin',
    arabicName: 'رياض الصالحين',
    author: 'Imam Yahya ibn Sharaf al-Nawawi',
    shortName: 'Riyad',
  },
  {
    slug: 'bulugh_almaram',
    filename: 'bulugh_almaram.json',
    group: 'other_books',
    displayName: 'Bulugh al-Maram',
    arabicName: 'بلوغ المرام',
    author: 'Ibn Hajar al-Asqalani',
    shortName: 'Bulugh',
  },
  {
    slug: 'mishkat_almasabih',
    filename: 'mishkat_almasabih.json',
    group: 'other_books',
    displayName: 'Mishkat al-Masabih',
    arabicName: 'مشكاة المصابيح',
    author: 'Muhammad ibn Abdullah al-Khatib al-Tabrizi',
    shortName: 'Mishkat',
  },
  {
    slug: 'aladab_almufrad',
    filename: 'aladab_almufrad.json',
    group: 'other_books',
    displayName: 'Al-Adab Al-Mufrad',
    arabicName: 'الأدب المفرد',
    author: 'Imam Muhammad al-Bukhari',
    shortName: 'Al-Adab',
  },
  {
    slug: 'shamail_muhammadiyah',
    filename: 'shamail_muhammadiyah.json',
    group: 'other_books',
    displayName: 'Shamail Muhammadiyah',
    arabicName: 'الشمائل المحمدية',
    author: 'Imam al-Tirmidhi',
    shortName: 'Shamail',
  },

  // ── The Forties (Arba'een) ────────────────────────────────────────
  {
    slug: 'nawawi40',
    filename: 'nawawi40.json',
    group: 'forties',
    displayName: 'Forty Hadith of Imam Nawawi',
    arabicName: 'الأربعون النووية',
    author: 'Imam Yahya ibn Sharaf al-Nawawi',
    shortName: 'Nawawi 40',
  },
  {
    slug: 'qudsi40',
    filename: 'qudsi40.json',
    group: 'forties',
    displayName: 'Forty Hadith Qudsi',
    arabicName: 'الأربعون القدسية',
    author: 'Collected',
    shortName: 'Qudsi 40',
  },
  {
    slug: 'shahwaliullah40',
    filename: 'shahwaliullah40.json',
    group: 'forties',
    displayName: 'Forty Hadith of Shah Waliullah',
    arabicName: 'أربعون ولي الله الدهلوي',
    author: 'Shah Waliullah Dahlawi',
    shortName: 'Waliullah 40',
  },
];

export const GROUP_LABELS: Record<CollectionGroup, string> = {
  the_9_books: 'The Nine Books',
  other_books: 'Other Collections',
  forties: "The Forties — Arba'een",
};

export const GROUP_DESCRIPTIONS: Record<CollectionGroup, string> = {
  the_9_books: 'The foundational corpus of authenticated hadith literature',
  other_books: 'Renowned compiled works of hadith and sunnah',
  forties: 'Selected collections of forty significant narrations',
};

export const GROUP_ORDER: CollectionGroup[] = ['the_9_books', 'other_books', 'forties'];

export function getCollectionBySlug(slug: string): CollectionInfo | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function getCollectionsByGroup(group: CollectionGroup): CollectionInfo[] {
  return COLLECTIONS.filter((c) => c.group === group);
}
