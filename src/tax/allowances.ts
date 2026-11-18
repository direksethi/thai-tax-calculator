import type { L } from "./types"
import type { AllowanceInputs, AllowanceResult, FilingStatus, TaxYear } from "./types"
import { YEARS, type YearConfig } from "./years"

export type AllowanceGroup = "family" | "insurance" | "funds" | "housing" | "measures" | "other"

export const GROUPS: { id: AllowanceGroup; label: L }[] = [
  { id: "family", label: { en: "Family", th: "ครอบครัว" } },
  { id: "insurance", label: { en: "Insurance and social security", th: "ประกันและประกันสังคม" } },
  { id: "funds", label: { en: "Savings and investment funds", th: "เงินออมและกองทุน" } },
  { id: "housing", label: { en: "Home", th: "ที่อยู่อาศัย" } },
  { id: "measures", label: { en: "Government measures", th: "มาตรการรัฐ" } },
  { id: "other", label: { en: "Donations and other", th: "เงินบริจาคและอื่น ๆ" } },
]

export type FieldKind = "amount" | "count"

export type AllowanceField = {
  key: string
  kind: FieldKind
  label: L
  max?: number
}

export type AllowanceDef = {
  id: string
  /** Item number on the 2568 deductions attachment. */
  item: string
  group: AllowanceGroup
  label: L
  /** One line on who qualifies and the limit. */
  rule: L
  fields: AllowanceField[]
  available: (year: YearConfig, ctx: { status: FilingStatus }) => boolean
  /** Shown as a status marker, for measures approved but not yet in law. */
  pending?: boolean
}

const always = () => true

export const ALLOWANCES: AllowanceDef[] = [
  {
    id: "children",
    item: "3",
    group: "family",
    label: { en: "Children", th: "บุตร" },
    rule: {
      en: "30,000 per child. 60,000 for the second and later children born in 2561 or later. Adopted children count up to three children in total. The child must be under 20, or under 25 and studying, with income under 30,000.",
      th: "คนละ 30,000 บาท บุตรคนที่ 2 เป็นต้นไปที่เกิดตั้งแต่ปี 2561 คนละ 60,000 บาท บุตรบุญธรรมนับรวมได้ไม่เกิน 3 คน บุตรต้องอายุไม่เกิน 20 ปี หรือไม่เกิน 25 ปีและศึกษาอยู่ และมีเงินได้ไม่ถึง 30,000 บาท",
    },
    fields: [
      { key: "children30", kind: "count", label: { en: "Children at 30,000", th: "บุตรคนละ 30,000 บาท" } },
      { key: "children60", kind: "count", label: { en: "Second and later, born 2561 or later", th: "คนที่ 2 ขึ้นไปที่เกิดตั้งแต่ปี 2561" } },
      { key: "adopted", kind: "count", label: { en: "Adopted children", th: "บุตรบุญธรรม" } },
    ],
    available: always,
  },
  {
    id: "parents",
    item: "4",
    group: "family",
    label: { en: "Parents", th: "อุปการะเลี้ยงดูบิดามารดา" },
    rule: {
      en: "30,000 per parent aged 60 or over with income under 30,000. Includes your spouse's parents if your spouse has no income. Only one child may claim each parent.",
      th: "คนละ 30,000 บาท บิดามารดาต้องอายุ 60 ปีขึ้นไปและมีเงินได้ไม่ถึง 30,000 บาท รวมบิดามารดาของคู่สมรสที่ไม่มีเงินได้ บุตรใช้สิทธิได้เพียงคนเดียวต่อบิดาหรือมารดาหนึ่งคน",
    },
    fields: [{ key: "parents", kind: "count", label: { en: "Parents you support", th: "จำนวนบิดามารดาที่อุปการะ" }, max: 4 }],
    available: always,
  },
  {
    id: "disabled",
    item: "5",
    group: "family",
    label: { en: "Disabled or incapacitated dependants", th: "อุปการะเลี้ยงดูคนพิการหรือคนทุพพลภาพ" },
    rule: {
      en: "60,000 per dependant with a disability card or incapacity certificate and income of 30,000 or less. Requires form Lor Yor 04.",
      th: "คนละ 60,000 บาท ผู้อยู่ในความอุปการะต้องมีบัตรคนพิการหรือใบรับรองความทุพพลภาพ และมีเงินได้ไม่เกิน 30,000 บาท ใช้แบบ ล.ย.04",
    },
    fields: [{ key: "disabled", kind: "count", label: { en: "Dependants", th: "จำนวนผู้อยู่ในความอุปการะ" }, max: 10 }],
    available: always,
  },
  {
    id: "prenatal",
    item: "14",
    group: "family",
    label: { en: "Prenatal care and childbirth", th: "ค่าฝากครรภ์และค่าคลอดบุตร" },
    rule: { en: "Actual cost, up to 60,000 per pregnancy, for you or your spouse.", th: "ตามที่จ่ายจริง ไม่เกิน 60,000 บาทต่อการตั้งครรภ์ ของผู้มีเงินได้หรือคู่สมรส" },
    fields: [{ key: "prenatal", kind: "amount", label: { en: "Amount paid", th: "จำนวนที่จ่าย" } }],
    available: always,
  },
  {
    id: "life",
    item: "7",
    group: "insurance",
    label: { en: "Life and health insurance", th: "เบี้ยประกันชีวิตและประกันสุขภาพ" },
    rule: {
      en: "Life insurance with a term of 10 years or more, up to 100,000. Your own health insurance, up to 25,000. Life and health together, up to 100,000. A spouse with no income adds up to 10,000 of their life premiums.",
      th: "ประกันชีวิตที่มีระยะเวลาตั้งแต่ 10 ปี ไม่เกิน 100,000 บาท ประกันสุขภาพตนเองไม่เกิน 25,000 บาท รวมกันไม่เกิน 100,000 บาท คู่สมรสที่ไม่มีเงินได้หักเพิ่มได้ไม่เกิน 10,000 บาท",
    },
    fields: [
      { key: "life", kind: "amount", label: { en: "Life insurance premiums", th: "เบี้ยประกันชีวิต" } },
      { key: "health", kind: "amount", label: { en: "Health insurance premiums", th: "เบี้ยประกันสุขภาพ" } },
      { key: "spouseLife", kind: "amount", label: { en: "Spouse's life insurance premiums", th: "เบี้ยประกันชีวิตของคู่สมรส" } },
    ],
    available: always,
  },
  {
    id: "parentHealth",
    item: "6",
    group: "insurance",
    label: { en: "Parents' health insurance", th: "เบี้ยประกันสุขภาพบิดามารดา" },
    rule: { en: "Premiums for your or your spouse's parents with income under 30,000, up to 15,000 in total.", th: "เบี้ยประกันสุขภาพบิดามารดาของผู้มีเงินได้และคู่สมรสที่มีเงินได้ไม่ถึง 30,000 บาท รวมไม่เกิน 15,000 บาท" },
    fields: [{ key: "parentHealth", kind: "amount", label: { en: "Premiums paid", th: "เบี้ยที่จ่าย" } }],
    available: always,
  },
  {
    id: "socialSecurity",
    item: "12",
    group: "insurance",
    label: { en: "Social security contributions", th: "เงินสมทบกองทุนประกันสังคม" },
    rule: {
      en: "Actual contributions. Employees pay 5% of wages up to 750 a month in 2568 (9,000 a year) and up to 875 a month from 2569 (10,500 a year).",
      th: "ตามที่จ่ายจริง ลูกจ้างจ่ายร้อยละ 5 ของค่าจ้าง ไม่เกินเดือนละ 750 บาทในปี 2568 (ปีละ 9,000 บาท) และไม่เกินเดือนละ 875 บาทตั้งแต่ปี 2569 (ปีละ 10,500 บาท)",
    },
    fields: [{ key: "socialSecurity", kind: "amount", label: { en: "Contributions paid", th: "เงินสมทบที่จ่าย" } }],
    available: always,
  },
  {
    id: "annuity",
    item: "7",
    group: "funds",
    label: { en: "Annuity life insurance", th: "เบี้ยประกันชีวิตแบบบำนาญ" },
    rule: {
      en: "Up to 15% of assessable income and 200,000. Any unused part of the 100,000 life insurance limit is used first. Counts toward the 500,000 retirement limit.",
      th: "ไม่เกินร้อยละ 15 ของเงินได้พึงประเมิน และไม่เกิน 200,000 บาท ใช้สิทธิในวงเงินประกันชีวิต 100,000 บาทที่เหลือก่อนได้ นับรวมในวงเงิน 500,000 บาทเพื่อการเกษียณ",
    },
    fields: [{ key: "annuity", kind: "amount", label: { en: "Premiums paid", th: "เบี้ยที่จ่าย" } }],
    available: always,
  },
  {
    id: "pvd",
    item: "8",
    group: "funds",
    label: { en: "Provident fund", th: "กองทุนสำรองเลี้ยงชีพ" },
    rule: {
      en: "Your own contributions, up to 15% of salary. The first 10,000 is an allowance; the rest is exempt income on the main form. Counts toward the 500,000 retirement limit.",
      th: "เงินสะสมส่วนของลูกจ้าง ไม่เกินร้อยละ 15 ของค่าจ้าง 10,000 บาทแรกเป็นค่าลดหย่อน ส่วนที่เกินเป็นเงินได้ที่ได้รับยกเว้นในแบบหลัก นับรวมในวงเงิน 500,000 บาท",
    },
    fields: [
      { key: "pvd", kind: "amount", label: { en: "Provident fund contributions", th: "เงินสะสมกองทุนสำรองเลี้ยงชีพ" } },
      { key: "gpf", kind: "amount", label: { en: "Government Pension Fund (GPF)", th: "เงินสะสม กบข." } },
      { key: "teacherFund", kind: "amount", label: { en: "Private school teachers' fund", th: "กองทุนสงเคราะห์ครูโรงเรียนเอกชน" } },
    ],
    available: always,
  },
  {
    id: "rmf",
    item: "10",
    group: "funds",
    label: { en: "Retirement mutual fund (RMF)", th: "กองทุนรวมเพื่อการเลี้ยงชีพ (RMF)" },
    rule: {
      en: "Up to 30% of assessable income. Hold for 5 years and until age 55. Counts toward the 500,000 retirement limit.",
      th: "ไม่เกินร้อยละ 30 ของเงินได้พึงประเมิน ถือครองอย่างน้อย 5 ปีและจนอายุครบ 55 ปี นับรวมในวงเงิน 500,000 บาท",
    },
    fields: [{ key: "rmf", kind: "amount", label: { en: "Units bought", th: "ค่าซื้อหน่วยลงทุน" } }],
    available: always,
  },
  {
    id: "nsf",
    item: "9",
    group: "funds",
    label: { en: "National Savings Fund (NSF)", th: "กองทุนการออมแห่งชาติ (กอช.)" },
    rule: { en: "Actual contributions, up to 30,000. Counts toward the 500,000 retirement limit.", th: "ตามที่จ่ายจริง ไม่เกิน 30,000 บาท นับรวมในวงเงิน 500,000 บาท" },
    fields: [{ key: "nsf", kind: "amount", label: { en: "Contributions", th: "เงินสะสม" } }],
    available: always,
  },
  {
    id: "thaiEsg",
    item: "18",
    group: "funds",
    label: { en: "Thai ESG fund", th: "กองทุนรวมไทยเพื่อความยั่งยืน (Thai ESG)" },
    rule: {
      en: "Up to 30% of assessable income and 300,000, separate from the 500,000 retirement limit. Hold for 5 years. From 2570 the limit falls to 100,000 with an 8-year hold.",
      th: "ไม่เกินร้อยละ 30 ของเงินได้พึงประเมิน และไม่เกิน 300,000 บาท แยกจากวงเงิน 500,000 บาท ถือครอง 5 ปี ตั้งแต่ปี 2570 ลดเหลือ 100,000 บาท ถือครอง 8 ปี",
    },
    fields: [{ key: "thaiEsg", kind: "amount", label: { en: "Units bought", th: "ค่าซื้อหน่วยลงทุน" } }],
    available: always,
  },
  {
    id: "thaiEsgx",
    item: "19",
    group: "funds",
    label: { en: "Thai ESGX fund", th: "กองทุนรวมไทยเพื่อความยั่งยืนแบบพิเศษ (Thai ESGX)" },
    rule: {
      en: "New purchases from 1 May to 30 June 2568: up to 30% of income and 300,000. LTF units switched: up to 300,000 in 2568, then the remainder spread evenly over 2569 to 2572, at most 50,000 a year.",
      th: "ซื้อใหม่ระหว่าง 1 พฤษภาคม ถึง 30 มิถุนายน 2568 ไม่เกินร้อยละ 30 ของเงินได้และไม่เกิน 300,000 บาท สับเปลี่ยนจาก LTF ไม่เกิน 300,000 บาทในปี 2568 ส่วนที่เหลือทยอยหักปี 2569 ถึง 2572 ไม่เกินปีละ 50,000 บาท",
    },
    fields: [
      { key: "thaiEsgxNew", kind: "amount", label: { en: "New units bought (19.1)", th: "ค่าซื้อหน่วยลงทุน (19.1)" } },
      { key: "thaiEsgxLtf", kind: "amount", label: { en: "LTF switch amount for this year (19.2)", th: "มูลค่าสับเปลี่ยนจาก LTF ของปีนี้ (19.2)" } },
    ],
    available: always,
  },
  {
    id: "homeLoan",
    item: "11",
    group: "housing",
    label: { en: "Home loan interest", th: "ดอกเบี้ยเงินกู้ยืมเพื่อที่อยู่อาศัย" },
    rule: { en: "Interest on a loan to buy, hire-purchase or build a home, secured on that home, up to 100,000. Co-borrowers share the limit.", th: "ดอกเบี้ยเงินกู้เพื่อซื้อ เช่าซื้อ หรือสร้างอาคารอยู่อาศัยที่จำนองไว้ ไม่เกิน 100,000 บาท ผู้กู้ร่วมแบ่งวงเงินกัน" },
    fields: [{ key: "homeLoan", kind: "amount", label: { en: "Interest paid", th: "ดอกเบี้ยที่จ่าย" } }],
    available: always,
  },
  {
    id: "homeConstruction",
    item: "20",
    group: "housing",
    label: { en: "New home construction", th: "ค่าก่อสร้างอาคารอยู่อาศัยใหม่" },
    rule: {
      en: "10,000 for every full 1,000,000 paid to a VAT-registered builder, up to 100,000, for one house. Contract signed and work started between 9 April 2567 and 31 December 2568. Claimed in the year the house is finished.",
      th: "10,000 บาทต่อค่าก่อสร้างทุก 1,000,000 บาท ที่จ่ายให้ผู้รับจ้างจดทะเบียนภาษีมูลค่าเพิ่ม ไม่เกิน 100,000 บาท สำหรับหนึ่งหลัง ทำสัญญาและเริ่มก่อสร้างระหว่าง 9 เมษายน 2567 ถึง 31 ธันวาคม 2568 ใช้สิทธิในปีที่ก่อสร้างเสร็จ",
    },
    fields: [{ key: "homeConstruction", kind: "amount", label: { en: "Construction cost", th: "ค่าจ้างก่อสร้าง" } }],
    available: (y) => y.homeConstruction,
  },
  {
    id: "solar",
    item: "23",
    group: "housing",
    label: { en: "Solar rooftop", th: "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคา" },
    rule: {
      en: "Cost of a grid-connected rooftop solar system on your home, up to 200,000, once. Installer must be VAT-registered and issue an e-Tax Invoice. From 3 March 2569.",
      th: "ค่าติดตั้งระบบโซลาร์รูฟที่เชื่อมต่อการไฟฟ้าบนที่อยู่อาศัย ไม่เกิน 200,000 บาท ใช้สิทธิได้ครั้งเดียว ผู้ติดตั้งต้องจดทะเบียนภาษีมูลค่าเพิ่มและออก e-Tax Invoice ตั้งแต่ 3 มีนาคม 2569",
    },
    fields: [{ key: "solar", kind: "amount", label: { en: "System cost", th: "ค่าระบบและติดตั้ง" } }],
    available: (y) => y.solarRooftop,
  },
  {
    id: "flood",
    item: "23",
    group: "housing",
    label: { en: "Flood repairs", th: "ค่าซ่อมแซมจากอุทกภัย" },
    rule: {
      en: "Repairs to a home damaged by flooding between 15 May and 31 December 2569 in a declared disaster area, up to 100,000. Vehicle repairs up to 30,000. Approved by cabinet on 20 October 2569; the regulation is not yet published.",
      th: "ค่าซ่อมแซมที่อยู่อาศัยที่เสียหายจากอุทกภัยระหว่าง 15 พฤษภาคม ถึง 31 ธันวาคม 2569 ในพื้นที่ประสบภัย ไม่เกิน 100,000 บาท ค่าซ่อมรถไม่เกิน 30,000 บาท คณะรัฐมนตรีอนุมัติเมื่อ 20 ตุลาคม 2569 กฎกระทรวงยังไม่ประกาศ",
    },
    fields: [
      { key: "floodHome", kind: "amount", label: { en: "Home repairs", th: "ค่าซ่อมแซมที่อยู่อาศัย" } },
      { key: "floodVehicle", kind: "amount", label: { en: "Vehicle repairs", th: "ค่าซ่อมรถยนต์หรือรถจักรยานยนต์" } },
    ],
    available: (y) => y.floodRelief,
    pending: true,
  },
  {
    id: "easyEReceipt",
    item: "17",
    group: "measures",
    label: { en: "Easy E-Receipt 2.0", th: "Easy E-Receipt 2.0" },
    rule: {
      en: "Purchases from 16 January to 28 February 2568 with an e-Tax Invoice or e-Receipt. Up to 30,000 for general goods, books and e-books, plus up to 20,000 more for OTOP, community and social enterprises. Excludes alcohol, tobacco, fuel, vehicles, utilities, travel and lodging.",
      th: "ซื้อสินค้าหรือบริการระหว่าง 16 มกราคม ถึง 28 กุมภาพันธ์ 2568 ที่มีใบกำกับภาษีอิเล็กทรอนิกส์หรือใบรับอิเล็กทรอนิกส์ สินค้าทั่วไป หนังสือ และหนังสืออิเล็กทรอนิกส์ไม่เกิน 30,000 บาท และสินค้า OTOP วิสาหกิจชุมชน วิสาหกิจเพื่อสังคม เพิ่มอีกไม่เกิน 20,000 บาท ไม่รวมสุรา ยาสูบ น้ำมัน รถ ค่าสาธารณูปโภค ค่าท่องเที่ยวและที่พัก",
    },
    fields: [
      { key: "eerGeneral", kind: "amount", label: { en: "Goods, services, books and e-books (17.1 to 17.3)", th: "สินค้า บริการ หนังสือ และหนังสืออิเล็กทรอนิกส์ (17.1 ถึง 17.3)" } },
      { key: "eerOtop", kind: "amount", label: { en: "OTOP, community and social enterprises (17.4)", th: "สินค้า OTOP วิสาหกิจชุมชน และวิสาหกิจเพื่อสังคม (17.4)" } },
    ],
    available: (y) => y.easyEReceipt,
  },
  {
    id: "travel",
    item: "22",
    group: "measures",
    label: { en: "Domestic travel", th: "ค่าท่องเที่ยวภายในประเทศ" },
    rule: {
      en: "Hotels, homestays and restaurants paid from 29 October to 15 December 2568. Up to 20,000 of spending: the first 10,000 on paper or e-Tax invoices, the next 10,000 on e-Tax invoices only. Secondary cities count 1.5 times, so the deduction reaches 30,000.",
      th: "ค่าโรงแรม โฮมสเตย์ และร้านอาหาร ระหว่าง 29 ตุลาคม ถึง 15 ธันวาคม 2568 ค่าใช้จ่ายไม่เกิน 20,000 บาท 10,000 บาทแรกใช้ใบกำกับภาษีกระดาษหรืออิเล็กทรอนิกส์ อีก 10,000 บาทต้องเป็น e-Tax Invoice เมืองรองหักได้ 1.5 เท่า สูงสุด 30,000 บาท",
    },
    fields: [
      { key: "travelMainPaper", kind: "amount", label: { en: "Main cities, paper invoice", th: "เมืองหลัก ใบกำกับภาษีกระดาษ" } },
      { key: "travelMainEtax", kind: "amount", label: { en: "Main cities, e-Tax Invoice", th: "เมืองหลัก e-Tax Invoice" } },
      { key: "travelSecPaper", kind: "amount", label: { en: "Secondary cities, paper invoice", th: "เมืองรอง ใบกำกับภาษีกระดาษ" } },
      { key: "travelSecEtax", kind: "amount", label: { en: "Secondary cities, e-Tax Invoice", th: "เมืองรอง e-Tax Invoice" } },
    ],
    available: (y) => y.domesticTravel,
  },
  {
    id: "art",
    item: "21",
    group: "measures",
    label: { en: "Visual art purchases", th: "ค่าซื้องานศิลปะสาขาทัศนศิลป์" },
    rule: {
      en: "Paintings, sculpture, prints, photography and mixed media by a National Artist, a Silpathorn artist or a registered artist, bought in Thailand from 1 January 2568 to 31 December 2570, up to 100,000 a year.",
      th: "จิตรกรรม ประติมากรรม ภาพพิมพ์ ภาพถ่าย และสื่อผสม ของศิลปินแห่งชาติ ศิลปินศิลปาธร หรือศิลปินที่ขึ้นทะเบียน ซื้อในประเทศระหว่าง 1 มกราคม 2568 ถึง 31 ธันวาคม 2570 ไม่เกินปีละ 100,000 บาท",
    },
    fields: [{ key: "art", kind: "amount", label: { en: "Amount paid", th: "จำนวนที่จ่าย" } }],
    available: (y) => y.art,
  },
  {
    id: "energy",
    item: "23",
    group: "measures",
    label: { en: "Energy-saving equipment, 5-star label", th: "อุปกรณ์ประหยัดพลังงานฉลากเบอร์ 5 ดาว" },
    rule: {
      en: "For business, professional, contracting and rental income only. An extra 50% of the cost of equipment with a 5-star energy label, bought with an e-Tax Invoice from 3 March 2569.",
      th: "เฉพาะเงินได้ตามมาตรา 40(5) ถึง 40(8) หักเพิ่มร้อยละ 50 ของค่าเครื่องจักร อุปกรณ์ หรือวัสดุที่มีฉลากประสิทธิภาพสูง 5 ดาว ซื้อด้วย e-Tax Invoice ตั้งแต่ 3 มีนาคม 2569",
    },
    fields: [{ key: "energy", kind: "amount", label: { en: "Equipment cost", th: "ค่าอุปกรณ์" } }],
    available: (y) => y.energyLabel,
  },
  {
    id: "cctv",
    item: "13",
    group: "measures",
    label: { en: "CCTV in southern special zones", th: "กล้องวงจรปิดในเขตพัฒนาพิเศษเฉพาะกิจ" },
    rule: {
      en: "An extra 100% of the cost of new CCTV at business premises in the southern special development zones, for income under 40(5) to 40(8) claimed with actual expenses.",
      th: "หักเพิ่มร้อยละ 100 ของค่าซื้อและติดตั้งกล้องวงจรปิดในสถานประกอบการในเขตพัฒนาพิเศษเฉพาะกิจ เฉพาะเงินได้ตามมาตรา 40(5) ถึง 40(8) ที่หักค่าใช้จ่ายตามจริง",
    },
    fields: [{ key: "cctv", kind: "amount", label: { en: "Cost", th: "ค่าใช้จ่าย" } }],
    available: (y) => y.cctv,
  },
  {
    id: "socialEnterprise",
    item: "16",
    group: "other",
    label: { en: "Social enterprise investment", th: "เงินลงทุนในวิสาหกิจเพื่อสังคม" },
    rule: { en: "Shares in a registered social enterprise at founding or capital increase, up to 100,000.", th: "เงินลงทุนในหุ้นของวิสาหกิจเพื่อสังคมที่จดทะเบียน เมื่อจัดตั้งหรือเพิ่มทุน ไม่เกิน 100,000 บาท" },
    fields: [{ key: "socialEnterprise", kind: "amount", label: { en: "Amount invested", th: "จำนวนเงินลงทุน" } }],
    available: always,
  },
  {
    id: "political",
    item: "15",
    group: "other",
    label: { en: "Political party donation", th: "เงินบริจาคแก่พรรคการเมือง" },
    rule: { en: "Up to 10,000. Thai nationals only.", th: "ไม่เกิน 10,000 บาท เฉพาะผู้มีสัญชาติไทย" },
    fields: [{ key: "political", kind: "amount", label: { en: "Amount donated", th: "จำนวนที่บริจาค" } }],
    available: always,
  },
  {
    id: "donations",
    item: "",
    group: "other",
    label: { en: "Donations", th: "เงินบริจาค" },
    rule: {
      en: "Education, sports, hospitals and listed causes count twice, up to 10% of income after allowances. Other charities count once, up to 10% of what remains. From 2569, charity donations count only through e-Donation.",
      th: "บริจาคเพื่อการศึกษา การกีฬา โรงพยาบาล และรายการที่กำหนด หักได้ 2 เท่า ไม่เกินร้อยละ 10 ของเงินได้หลังหักค่าลดหย่อน บริจาคทั่วไปหักได้ไม่เกินร้อยละ 10 ของส่วนที่เหลือ ตั้งแต่ปี 2569 ต้องบริจาคผ่านระบบ e-Donation",
    },
    fields: [
      { key: "donation2x", kind: "amount", label: { en: "Education, sports, hospitals (counts twice)", th: "การศึกษา การกีฬา โรงพยาบาล (หักได้ 2 เท่า)" } },
      { key: "donation", kind: "amount", label: { en: "Other charities", th: "การกุศลทั่วไป" } },
    ],
    available: always,
  },
  {
    id: "other",
    item: "23",
    group: "other",
    label: { en: "Other allowances", th: "ค่าลดหย่อนอื่น ๆ" },
    rule: { en: "Any other allowance granted by law, at the amount you are entitled to.", th: "ค่าลดหย่อนอื่นตามกฎหมาย ตามจำนวนที่มีสิทธิ" },
    fields: [{ key: "other", kind: "amount", label: { en: "Amount", th: "จำนวน" } }],
    available: always,
  },
]

export type AllowanceContext = {
  year: TaxYear
  status: FilingStatus
  /**
   * Base for the 15% and 30% limits: gross assessable income, including income
   * taxed finally at source (PND 90 item 10).
   */
  assessable: number
  /** Salary under 40(1), the base for provident fund limits. */
  salary: number
  /** Income under 40(5) to 40(8) claimed with actual expenses. */
  hasActualBusiness: boolean
  /** Income under 40(5) to 40(8) at all. */
  hasBusiness: boolean
}

export type AllowanceComputation = {
  rows: AllowanceResult[]
  total: number
  /** Provident fund, GPF and teachers' fund contributions above the allowance, exempt on the main form. */
  exemptFunds: { pvd: number; gpf: number; teacher: number }
  donations: { twice: number; once: number }
  retirementUsed: number
}

const v = (inputs: AllowanceInputs, key: string) => Math.max(0, inputs[key] ?? 0)

/**
 * Applies every allowance cap and the shared limits (life plus health 100,000;
 * the 500,000 retirement group) to the amounts entered. Rows come back in
 * attachment order so they can be read against the paper form.
 */
export function computeAllowances(inputs: AllowanceInputs, ctx: AllowanceContext): AllowanceComputation {
  const year = YEARS[ctx.year]
  const rows: AllowanceResult[] = []
  const push = (id: string, item: string, label: L, entered: number, allowed: number, cap?: number, note?: L) => {
    if (entered > 0 || allowed > 0) rows.push({ id, item, label, entered, allowed: Math.max(0, allowed), cap, note })
  }
  const married = ctx.status !== "single"
  const spouseCounts = ctx.status === "married_no_income"

  push("personal", "1", { en: "Personal allowance", th: "ผู้มีเงินได้" }, 60_000, 60_000)
  if (spouseCounts) push("spouse", "2", { en: "Spouse", th: "คู่สมรส" }, 60_000, 60_000)

  // Children: legitimate children are unlimited; adopted children only fill places up to three in total.
  const c30 = v(inputs, "children30")
  const c60 = v(inputs, "children60")
  const adoptedAllowed = Math.max(0, Math.min(v(inputs, "adopted"), 3 - (c30 + c60)))
  const childAmount = c30 * 30_000 + c60 * 60_000 + adoptedAllowed * 30_000
  push("children", "3", { en: "Children", th: "บุตร" }, childAmount, childAmount)

  const parents = Math.min(v(inputs, "parents"), spouseCounts ? 4 : 2)
  push("parents", "4", { en: "Parents", th: "อุปการะเลี้ยงดูบิดามารดา" }, parents * 30_000, parents * 30_000, spouseCounts ? 120_000 : 60_000)

  const disabled = v(inputs, "disabled")
  push("disabled", "5", { en: "Disabled dependants", th: "อุปการะคนพิการหรือคนทุพพลภาพ" }, disabled * 60_000, disabled * 60_000)

  push("parentHealth", "6", { en: "Parents' health insurance", th: "เบี้ยประกันสุขภาพบิดามารดา" }, v(inputs, "parentHealth"), Math.min(v(inputs, "parentHealth"), 15_000), 15_000)

  // Life and health share 100,000; health alone stops at 25,000.
  const health = Math.min(v(inputs, "health"), 25_000)
  const life = Math.min(v(inputs, "life"), 100_000 - health)
  const spouseLife = ctx.status === "married_no_income" ? Math.min(v(inputs, "spouseLife"), 10_000) : 0
  push("life", "7", { en: "Life insurance", th: "เบี้ยประกันชีวิต" }, v(inputs, "life"), life, 100_000)
  push("health", "7", { en: "Health insurance", th: "เบี้ยประกันสุขภาพ" }, v(inputs, "health"), health, 25_000)
  if (spouseLife > 0 || (married && v(inputs, "spouseLife") > 0))
    push("spouseLife", "7", { en: "Spouse's life insurance", th: "เบี้ยประกันชีวิตคู่สมรส" }, v(inputs, "spouseLife"), spouseLife, 10_000)

  // Retirement group, 500,000 in total, filled in the order the form lists them.
  let retirementRoom = 500_000
  const take = (amount: number) => {
    const used = Math.min(amount, retirementRoom)
    retirementRoom -= used
    return used
  }

  // Annuity premiums first use whatever is left of the 100,000 life limit, outside the retirement group.
  const annuityEntered = v(inputs, "annuity")
  const lifeRoom = Math.max(0, 100_000 - life - health)
  const annuityAsLife = Math.min(annuityEntered, lifeRoom)
  const annuityRest = Math.min(annuityEntered - annuityAsLife, 200_000, ctx.assessable * 0.15)

  const salaryCap = ctx.salary * 0.15
  const pvdEntered = v(inputs, "pvd")
  const pvdTotal = take(Math.min(pvdEntered, salaryCap))
  const gpfEntered = v(inputs, "gpf")
  const gpfTotal = take(Math.min(gpfEntered, ctx.salary * 0.3))
  const teacherEntered = v(inputs, "teacherFund")
  const teacherTotal = take(Math.min(teacherEntered, salaryCap))
  // The first 10,000 of fund contributions sits on the attachment; the rest is exempt income.
  const pvdAllowance = Math.min(pvdTotal, 10_000)
  const exemptFunds = { pvd: pvdTotal - pvdAllowance, gpf: gpfTotal, teacher: teacherTotal }

  const annuityAllowed = annuityAsLife + take(annuityRest)
  push("annuity", "7", { en: "Annuity life insurance", th: "เบี้ยประกันชีวิตแบบบำนาญ" }, annuityEntered, annuityAllowed, 200_000)
  push("pvd", "8", { en: "Provident fund, first 10,000", th: "กองทุนสำรองเลี้ยงชีพ ส่วนที่ไม่เกิน 10,000 บาท" }, pvdEntered, pvdAllowance, 10_000)

  const nsf = take(Math.min(v(inputs, "nsf"), 30_000))
  push("nsf", "9", { en: "National Savings Fund", th: "กองทุนการออมแห่งชาติ" }, v(inputs, "nsf"), nsf, 30_000)

  const rmf = take(Math.min(v(inputs, "rmf"), ctx.assessable * 0.3))
  push("rmf", "10", { en: "RMF", th: "RMF" }, v(inputs, "rmf"), rmf, Math.round(Math.min(ctx.assessable * 0.3, 500_000)))

  push("homeLoan", "11", { en: "Home loan interest", th: "ดอกเบี้ยเงินกู้ที่อยู่อาศัย" }, v(inputs, "homeLoan"), Math.min(v(inputs, "homeLoan"), 100_000), 100_000)

  const ss = Math.min(v(inputs, "socialSecurity"), year.socialSecurityMax)
  push("socialSecurity", "12", { en: "Social security", th: "ประกันสังคม" }, v(inputs, "socialSecurity"), ss, year.socialSecurityMax)

  if (year.cctv && v(inputs, "cctv") > 0)
    push(
      "cctv",
      "13",
      { en: "CCTV, southern special zones", th: "กล้องวงจรปิด เขตพัฒนาพิเศษเฉพาะกิจ" },
      v(inputs, "cctv"),
      ctx.hasActualBusiness ? v(inputs, "cctv") : 0,
      undefined,
      ctx.hasActualBusiness ? undefined : { en: "Requires 40(5) to 40(8) income with actual expenses", th: "ต้องมีเงินได้ตามมาตรา 40(5) ถึง 40(8) ที่หักค่าใช้จ่ายตามจริง" },
    )

  push("prenatal", "14", { en: "Prenatal care and childbirth", th: "ค่าฝากครรภ์และคลอดบุตร" }, v(inputs, "prenatal"), Math.min(v(inputs, "prenatal"), 60_000), 60_000)
  push("political", "15", { en: "Political party donation", th: "บริจาคพรรคการเมือง" }, v(inputs, "political"), Math.min(v(inputs, "political"), 10_000), 10_000)
  push("socialEnterprise", "16", { en: "Social enterprise investment", th: "ลงทุนวิสาหกิจเพื่อสังคม" }, v(inputs, "socialEnterprise"), Math.min(v(inputs, "socialEnterprise"), 100_000), 100_000)

  if (year.easyEReceipt) {
    const otop = v(inputs, "eerOtop")
    const general = v(inputs, "eerGeneral")
    // OTOP spending fills its own 20,000 first; anything above that may join the general 30,000.
    const otopExtra = Math.min(otop, 20_000)
    const generalPool = Math.min(general + Math.max(0, otop - 20_000), 30_000)
    push("easyEReceipt", "17", { en: "Easy E-Receipt 2.0", th: "Easy E-Receipt 2.0" }, general + otop, generalPool + otopExtra, 50_000)
  }

  push("thaiEsg", "18", { en: "Thai ESG", th: "Thai ESG" }, v(inputs, "thaiEsg"), Math.min(v(inputs, "thaiEsg"), ctx.assessable * 0.3, year.thaiEsgMax), year.thaiEsgMax)

  const esgxNew = year.thaiEsgxNew ? Math.min(v(inputs, "thaiEsgxNew"), ctx.assessable * 0.3, 300_000) : 0
  const esgxLtf = Math.min(v(inputs, "thaiEsgxLtf"), year.thaiEsgxLtfMax)
  push("thaiEsgx", "19", { en: "Thai ESGX", th: "Thai ESGX" }, v(inputs, "thaiEsgxNew") + v(inputs, "thaiEsgxLtf"), esgxNew + esgxLtf)

  if (year.homeConstruction) {
    const cost = v(inputs, "homeConstruction")
    push("homeConstruction", "20", { en: "New home construction", th: "ค่าก่อสร้างอาคารอยู่อาศัยใหม่" }, cost, Math.min(100_000, Math.floor(cost / 1_000_000) * 10_000), 100_000)
  }
  if (year.art) push("art", "21", { en: "Visual art", th: "ค่าซื้องานศิลปะ" }, v(inputs, "art"), Math.min(v(inputs, "art"), 100_000), 100_000)

  if (year.domesticTravel) {
    const t = travelDeduction({
      mainPaper: v(inputs, "travelMainPaper"),
      mainEtax: v(inputs, "travelMainEtax"),
      secPaper: v(inputs, "travelSecPaper"),
      secEtax: v(inputs, "travelSecEtax"),
    })
    push("travel", "22", { en: "Domestic travel", th: "ค่าท่องเที่ยวภายในประเทศ" }, t.spent, t.deduction, 30_000)
  }

  if (year.solarRooftop) push("solar", "23", { en: "Solar rooftop", th: "โซลาร์รูฟ" }, v(inputs, "solar"), Math.min(v(inputs, "solar"), 200_000), 200_000)
  if (year.energyLabel && v(inputs, "energy") > 0)
    push(
      "energy",
      "23",
      { en: "Energy-saving equipment, extra 50%", th: "อุปกรณ์ประหยัดพลังงาน หักเพิ่มร้อยละ 50" },
      v(inputs, "energy"),
      ctx.hasBusiness ? v(inputs, "energy") * 0.5 : 0,
      undefined,
      ctx.hasBusiness ? undefined : { en: "Requires 40(5) to 40(8) income", th: "ต้องมีเงินได้ตามมาตรา 40(5) ถึง 40(8)" },
    )
  if (year.floodRelief) {
    const home = Math.min(v(inputs, "floodHome"), 100_000)
    const vehicle = Math.min(v(inputs, "floodVehicle"), 30_000)
    push("flood", "23", { en: "Flood repairs (pending regulation)", th: "ค่าซ่อมแซมจากอุทกภัย (รอกฎกระทรวง)" }, v(inputs, "floodHome") + v(inputs, "floodVehicle"), home + vehicle, 130_000)
  }
  push("other", "23", { en: "Other", th: "อื่น ๆ" }, v(inputs, "other"), v(inputs, "other"))

  const total = rows.reduce((sum, r) => sum + r.allowed, 0)
  return {
    rows,
    total,
    exemptFunds,
    donations: { twice: v(inputs, "donation2x"), once: v(inputs, "donation") },
    retirementUsed: 500_000 - retirementRoom,
  }
}

/**
 * Domestic travel 2568, following the Revenue Department's worked example:
 * the first 10,000 bucket takes paper invoices (secondary cities first) and is
 * topped up from e-Tax invoices; the second 10,000 takes e-Tax invoices only.
 * Secondary-city spending counts 1.5 times.
 */
export function travelDeduction(s: { mainPaper: number; mainEtax: number; secPaper: number; secEtax: number }) {
  let secEtax = s.secEtax
  let mainEtax = s.mainEtax
  let roomA = 10_000
  let deduction = 0
  const fill = (amount: number, room: number, factor: number) => {
    const used = Math.min(amount, room)
    deduction += used * factor
    return used
  }
  roomA -= fill(s.secPaper, roomA, 1.5)
  roomA -= fill(s.mainPaper, roomA, 1)
  const secA = fill(secEtax, roomA, 1.5)
  roomA -= secA
  secEtax -= secA
  const mainA = fill(mainEtax, roomA, 1)
  roomA -= mainA
  mainEtax -= mainA
  let roomB = 10_000
  roomB -= fill(secEtax, roomB, 1.5)
  fill(mainEtax, roomB, 1)
  return { spent: s.mainPaper + s.mainEtax + s.secPaper + s.secEtax, deduction }
}
