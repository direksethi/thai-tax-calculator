import type { Subtype } from "./income"

/**
 * Standard expense rates for section 40(8), Royal Decree No. 11 as amended by
 * No. 629 (2560), as printed in table 2 of the 2568 PND 90 instructions. Every
 * listed business is 60%, except performers (60% of the first 300,000 and 40%
 * of the rest, capped at 600,000). Anything not listed takes actual expenses.
 * The most common entries come first.
 */
export const BUSINESS_TYPES: Subtype[] = [
  { key: "27", label: { en: "Selling goods you did not make (retail, online stores, resale)", th: "การขายสินค้าที่ผู้ขายมิได้เป็นผู้ผลิต (ค้าปลีก ร้านออนไลน์)" }, rate: 0.6 },
  { key: "9", label: { en: "Restaurant, hotel, food and drink", th: "โรงแรม ภัตตาคาร การทำอาหารและเครื่องดื่มจำหน่าย" }, rate: 0.6 },
  { key: "17", label: { en: "Transport or vehicle hire", th: "การขนส่งหรือรับจ้างด้วยยานพาหนะ" }, rate: 0.6 },
  { key: "10", label: { en: "Hairdressing, beauty and body care", th: "การดัด ตัด แต่งผม หรือตกแต่งร่างกาย" }, rate: 0.6 },
  { key: "7", label: { en: "Tailoring, sewing, knitting, embroidery", th: "การตัด เย็บ ถัก ปักเสื้อผ้า" }, rate: 0.6 },
  { key: "4", label: { en: "Photography and photo printing", th: "การถ่าย ล้าง อัด หรือขยายรูปถ่าย" }, rate: 0.6 },
  { key: "12", label: { en: "Writing literary works", th: "การทำวรรณกรรม" }, rate: 0.6 },
  { key: "1", label: { en: "Performers: actors, singers, musicians, athletes", th: "นักแสดง นักร้อง นักดนตรี นักกีฬาอาชีพ" }, rate: 0.6, hint: { en: "60% of the first 300,000 and 40% above, up to 600,000", th: "ร้อยละ 60 ของ 300,000 บาทแรก ส่วนที่เกินร้อยละ 40 รวมไม่เกิน 600,000 บาท" } },
  { key: "38", label: { en: "Farming annual crops and grains", th: "การทำเกษตรกรรมประเภทไม้ล้มลุกและธัญชาติ" }, rate: 0.6 },
  { key: "40", label: { en: "Raising animals", th: "การเลี้ยงสัตว์ทุกชนิด" }, rate: 0.6 },
  { key: "16", label: { en: "Forestry, rubber and perennial plantations", th: "การทำป่าไม้ สวนยาง หรือไม้ยืนต้น" }, rate: 0.6 },
  { key: "33", label: { en: "Fishing", th: "การจับสัตว์น้ำ" }, rate: 0.6 },
  { key: "8", label: { en: "Furniture making and repair", th: "การทำ ตกแต่ง หรือซ่อมแซมเครื่องเรือน" }, rate: 0.6 },
  { key: "6", label: { en: "Shoes and leather goods", th: "การทำรองเท้าและเครื่องหนัง" }, rate: 0.6 },
  { key: "11", label: { en: "Soap, shampoo and cosmetics", th: "การทำสบู่ แชมพู หรือเครื่องสำอาง" }, rate: 0.6 },
  { key: "13", label: { en: "Silver, gold, gems and jewellery trade", th: "การค้าเครื่องเงิน ทองรูปพรรณ นาก เพชร พลอย" }, rate: 0.6 },
  { key: "26", label: { en: "Laundry and dyeing", th: "การซักรีดหรือย้อมสี" }, rate: 0.6 },
  { key: "18", label: { en: "Printing, block making, bookbinding", th: "การทำบล็อกและตรา การพิมพ์ การเย็บสมุด" }, rate: 0.6 },
  { key: "22", label: { en: "Generating or selling electricity", th: "การผลิตหรือขายไฟฟ้า" }, rate: 0.6 },
  { key: "14", label: { en: "Hospital with inpatient beds", th: "โรงพยาบาลที่มีเตียงคนไข้ค้างคืน" }, rate: 0.6 },
  { key: "2", label: { en: "Selling land by instalments", th: "การขายที่ดินเงินผ่อนหรือให้เช่าซื้อที่ดิน" }, rate: 0.6 },
  { key: "3", label: { en: "Gambling, contest or game fees", th: "การเก็บค่าต๋งจากการพนัน การแข่งขัน หรือการเล่นต่าง ๆ" }, rate: 0.6 },
  { key: "5", label: { en: "Docks, shipyards, boat repair", th: "การทำอู่ต่อเรือ หรือซ่อมเรือ" }, rate: 0.6 },
  { key: "15", label: { en: "Stone crushing", th: "การโม่หรือย่อยหิน" }, rate: 0.6 },
  { key: "19", label: { en: "Mining", th: "การทำเหมืองแร่" }, rate: 0.6 },
  { key: "20", label: { en: "Beverage production", th: "การทำเครื่องดื่มตามกฎหมายว่าด้วยภาษีสรรพสามิต" }, rate: 0.6 },
  { key: "21", label: { en: "Tiles, ceramics, cement goods, earthenware", th: "การทำกระเบื้อง เครื่องเคลือบ เครื่องปั้นดินเผา" }, rate: 0.6 },
  { key: "23", label: { en: "Ice making", th: "การทำน้ำแข็ง" }, rate: 0.6 },
  { key: "24", label: { en: "Glue, starch and flour", th: "การทำกาว แป้ง และสิ่งที่คล้ายคลึง" }, rate: 0.6 },
  { key: "25", label: { en: "Glassware, plastics and finished rubber goods", th: "การทำลูกโป่ง เครื่องแก้ว เครื่องพลาสติก เครื่องยาง" }, rate: 0.6 },
  { key: "28", label: { en: "Horse racing prizes to owners", th: "การได้รับรางวัลในการประกวด แข่งขันม้า" }, rate: 0.6 },
  { key: "29", label: { en: "Redemption under sale with right of redemption", th: "การไถ่ถอนจากการขายฝาก" }, rate: 0.6 },
  { key: "30", label: { en: "Rubber smoking and rubber sheets", th: "การรมยาง การทำยางแผ่น" }, rate: 0.6 },
  { key: "31", label: { en: "Tanning", th: "การฟอกหนัง" }, rate: 0.6 },
  { key: "32", label: { en: "Sugar and molasses", th: "การทำน้ำตาล หรือน้ำเหลืองของน้ำตาล" }, rate: 0.6 },
  { key: "34", label: { en: "Sawmill", th: "การทำโรงเลื่อย" }, rate: 0.6 },
  { key: "35", label: { en: "Oil distilling and pressing", th: "การกลั่นหรือหีบน้ำมัน" }, rate: 0.6 },
  { key: "36", label: { en: "Hire-purchase of movable property", th: "การให้เช่าซื้อสังหาริมทรัพย์ที่ไม่เข้าลักษณะตามมาตรา 40(5)" }, rate: 0.6 },
  { key: "37", label: { en: "Rice mill", th: "การทำโรงสีข้าว" }, rate: 0.6 },
  { key: "39", label: { en: "Curing tobacco leaves", th: "การอบหรือบ่มใบยาสูบ" }, rate: 0.6 },
  { key: "41", label: { en: "Slaughtering for sale", th: "การฆ่าสัตว์จำหน่าย" }, rate: 0.6 },
  { key: "42", label: { en: "Salt farming", th: "การทำเกลือ" }, rate: 0.6 },
  { key: "43", label: { en: "Selling ships and rafts", th: "การขายเรือกำปั่น เรือกลไฟ เรือยนต์ หรือแพ" }, rate: 0.6 },
  { key: "44", label: { en: "Any other business, actual expenses", th: "เงินได้อื่นนอกจาก (1) ถึง (43) หักค่าใช้จ่ายตามจริง" }, rate: null },
]

/** Performers: 60% of the first 300,000, 40% above, total deduction capped at 600,000. */
export function performerExpense(gross: number): number {
  return Math.min(Math.min(gross, 300_000) * 0.6 + Math.max(0, gross - 300_000) * 0.4, 600_000)
}
