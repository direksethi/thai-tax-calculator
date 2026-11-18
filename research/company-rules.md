# Thai company vs personal taxation: implementation spec (2568/2569)

Research date: 2026-11-04 (B.E. 2569). Scope: rules for a "personal vs company" optimizer (`src/tax/company.ts`).
Years: tax year 2568 (2025, filed early 2026) and 2569 (2026, filed early 2027). B.E. = C.E. + 543.

Confidence legend used throughout:

- **[STATUTE]** read directly from the Revenue Code text or a Royal Gazette instrument on rd.go.th / dbd.go.th.
- **[RD]** Revenue Department guidance, forms, manuals, rulings.
- **[2ND]** reliable secondary source (PEAK, FlowAccount, iTAX, Dharmniti, tax-ez, law firms, news).
- **[UNCERTAIN]** conflicting or unverified; the engine should expose it as a setting or a caveat.

---

## 1. Corporate income tax (CIT)

### 1.1 Tax base

- CIT is levied on **net profit**: revenue from or due to the business in the accounting period, minus expenses allowed under s.65 bis and s.65 ter. Accrual basis. The accounting period is 12 months (shorter only for the first period, the final period, or an approved change). [STATUTE s.65, rd.go.th/5939.html]
- Accounting-to-tax bridge: start from accounting profit, **add back** non-deductible items (s.65 ter list in section 4), apply extra deductions (super deductions), subtract exempt income (for example 50% or 100% of dividends received from Thai companies, s.65 bis(10)). [RD rd.go.th/828.html]
- Tax losses carry forward **5 years** only (s.65 ter(12)). No carry-back. [STATUTE]

### 1.2 Rates

Standard rate: **20% of net profit** (the schedule rate is 30%, reduced to 20% by royal decree). [RD SME guide; 2ND iTAX pedia]

SME rate (company or **juristic partnership**), accounting periods from 2560 onwards, still current for 2568 and 2569: [RD rd.go.th/fileadmin/user_upload/SMEs/infographic/SME_lv3_2.pdf; STATUTE RD 530 B.E. 2554 ss.6-8, amended by RD 583 B.E. 2558 and RD 603 B.E. 2559, rd.go.th/28271.html; 2ND PEAK article dated 14 Aug 2026]

| Net profit (THB) | Rate |
|---|---|
| 0 to 300,000 | exempt (0%) |
| 300,001 to 3,000,000 | 15% |
| above 3,000,000 | 20% |

Conditions (both must hold):

1. Paid-up capital on the **last day of the accounting period** is not more than 5,000,000.
2. Revenue from **sales of goods and services** in the period is not more than 30,000,000.

Implementation notes:

- RD 530 s.8 adds a **"never exceeded" test**: the company must not have had paid-up capital above 5M on the last day of **any** accounting period, nor sales/service revenue above 30M in **any** accounting period, counting periods starting on or after 1 Jan 2555 (2012). The RD SME guide words this as "ต่อเนื่องกันตั้งแต่รอบระยะเวลาบัญชีที่เริ่มในหรือหลังวันที่ 1 มกราคม 2555". Practitioner reading (tax-ez, Dailynews tax column): once a company exceeds either limit at any period end since 2012, it loses the SME rate permanently, and reducing capital later does not restore it. Capital raised above 5M and reduced again before the period end does not count, because only the last day is tested. [STATUTE text quoted in tax-ez.info/QA/View/7pdd08wm and dailynews.co.th/news/2169283]
  - [UNCERTAIN] Some blogs (aplusme, PEAK) say the SME rate returns if revenue drops below 30M the next year. The statute and RD guide support the permanent-loss reading. Engine: add a boolean "has exceeded 5M capital or 30M revenue in any period since 2012"; if true, use 20% flat.
- One baht over 30M revenue means 20% from the first baht (no phase-in). [2ND PEAK]
- "Revenue" for the 30M test is sales of goods and services, not total revenue (interest, gains and other income are excluded). [STATUTE wording]

```
smeCit(p)     = 0.15 * clamp(p - 300_000, 0, 2_700_000) + 0.20 * max(p - 3_000_000, 0)
generalCit(p) = 0.20 * max(p, 0)
```

### 1.3 Half-year return PND 51 (s.67 bis, s.67 ter)

- Due **within 2 months after the end of the first 6 months** of the accounting period (calendar-year company: 31 August; e-filing plus 8 days, see 6.2). [STATUTE s.67 bis; RD SME guide]
- Non-listed company: estimate full-year net profit, then compute and pay tax on **half of the estimated net profit**. Credited against PND 50. [STATUTE s.67 bis(1)]
  - Engine: `pnd51Tax = cit(estimatedAnnualProfit / 2)` with the same rate table (the form applies the bands to half the estimate). [RD form logic; 2ND]
- Not required if the first or last accounting period is shorter than 12 months. [STATUTE s.67 bis para 3]
- Must be filed even with an estimated loss. [RD SME guide]
- **Underestimation penalty**: if the estimate falls short of actual net profit by **more than 25%** without reasonable cause, the surcharge is **20%** of the tax shortfall. The 25% is the threshold; **the surcharge rate is 20%, not 25%**. Not filing PND 51 at all: 20% surcharge on the tax due plus a fine up to 2,000 baht. [STATUTE s.67 ter; RD SME guide]
- Reasonable-cause safe harbour (RD Order Por. 50/2537, clause 1 amended by Por. 152/2558): no surcharge if (a) the PND 51 tax paid was at least half of the previous year's CIT, or (b) the estimate was not less than the previous year's net profit and the half-year tax was lower only because of an exemption or reduced rate. [2ND tax-ez.info/QA/View/6KAU8yq8]
- Waiver and reduction criteria for the s.67 ter surcharge were amended by Order Tor.Por. 369/2569 (listed 9 June 2569, amends Tor.Por. 81/2542). Content not extracted. [RD list rd.go.th/21221.html] [UNCERTAIN]

### 1.4 Annual return PND 50 (s.68, s.69)

- Due **within 150 days** after the end of the accounting period, with financial statements certified by a CPA (or a Tax Auditor for small partnerships, see 6.3). Calendar-year company: 29 May on paper, 158 days with e-filing. [STATUTE s.68, s.69; RD SME guide]
- PND 51 tax and all withholding tax suffered (50 bis certificates) are credited against the year's CIT; refund if negative. [RD SME guide]
- Late payment: 1.5% per month or part month on unpaid tax, capped at the tax amount. Failure to file: fine up to 2,000 baht (up to 4,000 under s.35 for also not filing accounts). [RD SME guide]

---

## 2. Dividends

### 2.1 Withholding and the final-tax option

- A dividend from a Thai company or juristic partnership to a resident individual is s.40(4)(b) income. The company withholds **10%** and files **PND 2** by the 7th of the following month (15th with e-filing). [STATUTE s.50(2); 2ND billsos]
- The individual may treat the 10% as **final** (exclude from PND 90/91) under **s.48(3)** final paragraph: "ผู้มีเงินได้ซึ่งเป็นผู้อยู่ในประเทศไทยจะเลือกเสียภาษีในอัตราร้อยละ 10.0 ... สำหรับเงินได้ตามมาตรา 40 (4) (ข) ที่ได้รับจากบริษัทหรือห้างหุ้นส่วนนิติบุคคลที่ตั้งขึ้นตามกฎหมายไทย". [STATUTE rd.go.th/5937.html]
- Or include it in PND 90 and claim the **dividend tax credit** under s.47 bis. If including, the individual must include **all** creditable dividends from **all** payers for that year; no cherry-picking. [RD Order Por. 119/2545 clause 19, rd.go.th/11162.html]
- No expense deduction is allowed against 40(4) income. [RD PND 90 guide 2568]
- Shareholder bonuses ("เงินโบนัสที่จ่ายแก่ผู้ถือหุ้นหรือผู้เป็นหุ้นส่วน") are also 40(4)(b) to the recipient and, if fixed from profit, non-deductible to the company under s.65 ter(19). [RD PND 90 guide 2568 p.3; STATUTE]

### 2.2 Dividend tax credit (s.47 bis)

Statutory formula: credit = dividend x (CIT rate) / (100 - CIT rate), where the CIT rate is the rate the company paid on the profits the dividend comes from. If the company was taxed at several rates, the payer must state on the withholding certificate how much of the dividend came from profit taxed at each rate. [STATUTE s.47 bis, rd.go.th/5937.html]

| CIT rate on underlying profit | Credit as fraction of cash dividend |
|---|---|
| 20% | 20/80 = 1/4 |
| 15% (SME middle band) | 15/85 = 3/17 |
| 0% (SME first 300,000) | 0 (no credit) |
| BOI-exempt profit, petroleum-income profit, profit not taxed under the Revenue Code | no credit |
| 30%, 25%, 23%, 10% (historic or special rates) | 3/7, 1/3, 23/77, 1/9 |

Rules:

- The credit is grossed up into income: assessable dividend income = cash dividend + credit. PIT is computed on total income, then the credit and the 10% WHT are subtracted; any excess is refunded. [STATUTE s.47 bis para 2]
- No credit for dividends paid from BOI-exempt profits; the certificate must say "ไม่ได้รับเครดิตภาษีตามมาตรา 47 ทวิ". Mixed sources: the certificate splits creditable and non-creditable amounts. [RD Por. 119/2545 clauses 2, 10, 12] Profit sheltered by tax losses carried forward is also treated as untaxed (no credit). [2ND tax-ez; RD ruling 37/2551 says the credit requires profit that was actually taxed under the Revenue Code]
- If the payer cannot identify which profits are distributed, it must **average** pro rata to the after-tax profit in each rate band. [RD Por. 119/2545 clause 13]
- Non-residents get no credit. [STATUTE s.47 bis para 3]

Engine algorithm (dividend paid from a single year's profit):

```ts
const t0  = Math.min(p, 300_000);                 // taxed at 0%
const t15 = clamp(p - 300_000, 0, 2_700_000);     // taxed at 15%
const t20 = Math.max(p - 3_000_000, 0);           // taxed at 20%
const after = { r0: t0, r15: t15 * 0.85, r20: t20 * 0.80 }; // after-tax profit per band
const total = after.r0 + after.r15 + after.r20;
// pro-rata averaging (Por. 119/2545 cl.13) unless the user designates bands
const credit = dividend * (after.r15 / total) * (15 / 85)
             + dividend * (after.r20 / total) * (20 / 80);
```

When 100% of a year's after-tax profit is distributed, the total credit equals the CIT the company paid. Retained profit keeps its band mix; track bands per year if multi-year retention is modelled.

Worked example **D1** (validation fixture):

- SME company net profit 1,000,000. CIT = (1,000,000 - 300,000) x 15% = 105,000. After-tax profit 895,000: 300,000 from the 0% band, 595,000 from the 15% band.
- Distribute all 895,000 (ignore the legal reserve for this example). WHT 10% = 89,500.
- Credit = 595,000 x 15/85 = 105,000. Grossed-up income = 1,000,000.
- Option A (final tax): owner tax 89,500. Owner cash 805,500. Total burden 194,500.
- Option B (include), owner has no other income: net income = 1,000,000 - 60,000 = 940,000; PIT = 65,000 + 190,000 x 20% = 103,000; minus credit 105,000 = -2,000; minus WHT already paid 89,500 gives a refund of 91,500. Owner net tax -2,000; total burden (CIT + PIT) = 103,000.
- Minimum-tax check (s.48(2)): 0.5% x 1,000,000 = 5,000, not above 5,000, so exempt.

Rule of thumb: including is better when the owner's marginal PIT rate is below the band's combined rate (about 10% for profit from the 0% band, 23.5% for the 15% band, 28% for the 20% band), but the election is all-or-nothing per year, so compute both and pick the lower.

### 2.3 Distributable profit, legal reserve, timing

- Dividends only from profits; none while accumulated losses remain unrecovered. Declared by resolution of the shareholders' meeting. The board may pay **interim dividends** when the company has sufficient profit. [Civil and Commercial Code (CCC) s.1201; 2ND FlowAccount, deka.in.th]
- **Legal reserve**: each time a dividend is paid, the company must set aside at least **1/20 (5%) of the profit** until the reserve reaches **1/10 (10%) of registered capital**, or more if the articles require. [CCC s.1202, deka.in.th/laws/ccc/1202]
  - Engine: `reserveAlloc = min(0.05 * profitForPeriod, max(0.10 * registeredCapital - reserveBalance, 0))`. With 1M registered capital the reserve caps at 100,000 and stops mattering after year 1 or 2.
  - CCC s.1202 sits in the limited-company chapter; registered and limited partnerships have **no statutory legal reserve**. [UNCERTAIN, inferred from CCC structure]
- The AGM within 4 months after year end approves the accounts and dividends (see 6.2). Final dividends are therefore paid in the year after the profit; interim dividends can be paid during the year.

---

## 3. Owner salary, director fees, social security

### 3.1 Income character for the owner

- **Salary, wages, bonus** from employment: **s.40(1)**. **Director fees and meeting allowances** (ค่าตอบแทนกรรมการ, เบี้ยประชุม, บำเหน็จ): **s.40(2)** (income from a position or office). [STATUTE s.40; 2ND accprotax]
- Both share one deemed expense: **50% of 40(1) + 40(2) combined, capped at 100,000** (s.42 bis, Act No. 44 B.E. 2560). [STATUTE rd.go.th/5937.html]
- 40(1) is excluded from the 0.5% minimum-tax base (s.48(2)); 40(2) is **not** excluded. [STATUTE s.48(2) last paragraph]
- The company withholds PIT on both under s.50(1) (annualised progressive method), monthly **PND 1**, annual **PND 1 Kor** by end of February, and issues 50 bis certificates. [2ND billsos; RD calendars]

### 3.2 Deductibility for the company

- Salary and fees are deductible if actually paid, for the business, properly withheld and **not excessive**: s.65 ter(8) disallows "เงินเดือนของผู้ถือหุ้นหรือผู้เป็นหุ้นส่วนเฉพาะส่วนที่จ่ายเกินสมควร". [STATUTE s.65 ter(8)]
  - Reasonableness is judged by duties, market pay, company size and revenue; there is no numeric rule. [2ND accprotax.com/director-salary] Engine: warn when the salary looks high relative to pre-salary profit or a market benchmark; do not hard-block.
  - RD ruling Kor Kor 0702/5238 (2555): an MD's salary and benefits under an employment contract are not barred by s.65 ter(3) and (13). [RD, via search]
- Any amount **fixed as a share of profit after year end** (director bonus "from profit", shareholder bonus) is non-deductible under s.65 ter(19). Pay a fixed salary, or a bonus under a formula set and accrued within the year. [STATUTE; 2ND twentyfouraa]
- Partner withdrawals without consideration in a juristic partnership are non-deductible (s.65 ter(7)). [STATUTE]

### 3.3 Social security (SSO)

Section 33 (employees):

- Rate: employer 5% + employee 5% of monthly wages (government 2.75%). Due by the 15th of the following month. [2ND DLA Piper, Omni HR]
- Wage base under the Ministerial Regulation on minimum and maximum wages for s.33 contributions B.E. 2568 (gazetted 12 Dec 2568, in force 1 Jan 2569, repeals MR No. 7 B.E. 2538): [2ND prachachat.net/sd/sdplus-hr/news-1936370, dlapiper.com publication 2025/12]

| Period | Wage floor | Wage ceiling | Max contribution per side per month | Per side per year |
|---|---|---|---|---|
| to 31 Dec 2568 (2025) | 1,650 | 15,000 | 750 | 9,000 |
| 1 Jan 2569 to 31 Dec 2571 (2026 to 2028) | 1,650 | 17,500 | 875 | 10,500 |
| 1 Jan 2572 to 31 Dec 2574 (2029 to 2031) | 1,650 | 20,000 | 1,000 | 12,000 |
| from 1 Jan 2575 (2032 onward) | 1,650 | 23,000 | 1,150 | 13,800 |

- Employer contribution is a deductible CIT expense; employee contribution is a PIT allowance at the actual amount. [2ND PEAK]
- **Can an owner-director be a s.33 insured person?** Only "employees" can. SSO practice, as reported by accounting firms, treats a founder or promoter, a shareholder with a substantial stake, or an authorised director who is not subject to company work rules and works to share profits, as an **employer**, not an employee. A director hired under an employment contract who is not a founder or shareholder can be an employee. Contributions paid while not genuinely an employee may give no benefit entitlement. [2ND zerotoprofit.co, accprotax.com/social-security-director, twentyfouraa]
  - [UNCERTAIN] No SSO circular or Supreme Court decision number was found. Many small companies do register the owner and the SSO often accepts it at registration; entitlement is tested at claim time. Engine: default `ownerInSso33 = false` with a toggle; when true, add employer cost 5% x min(salary, ceiling) and the employee allowance.

Section 39 (voluntary, former employees): at least 12 months of s.33 contributions and left employment within the last 6 months; **432 baht/month** (9% of a deemed 4,800). [2ND readthecloud.co, krungsri.com, thaijobsgov]

Section 40 (self-employed and informal workers not insured under s.33 or s.39): option 1 = 70 baht/month, option 2 = 100, option 3 = 300 (government adds 30 / 50 / 150). Entry age 15 to 60 (some sources say 65). Contributions are PIT-deductible. [2ND Thai PBS Policy Watch, FlowAccount, thaijobsgov] [UNCERTAIN on the age ceiling]

---

## 4. Deductible vs non-deductible expenses (CIT)

### 4.1 Section 65 ter list [STATUTE rd.go.th/5939.html]

| Clause | Not deductible |
|---|---|
| (1) | Reserves (except specified insurance reserves and bank loan-loss reserves) |
| (2) | Funds, except approved provident funds |
| (3) | Personal expenses, gifts, charity, except: (a) political party donations up to 50,000; (b) approved public charity up to **2% of net profit**, plus approved education/sport up to **another 2%** |
| (4) | Entertainment not meeting Ministerial Regulation No. 143 |
| (5) | Capital expenditure; additions and improvements (not repairs to maintain condition) |
| (6) | Tax penalties and surcharges, criminal fines, **CIT itself** |
| (6 bis) | VAT paid or payable and creditable input VAT of a VAT registrant; non-creditable input VAT under s.82/5 (for example passenger cars, entertainment) may be expensed (RD 243) |
| (7) | Withdrawals without consideration by partners of a juristic partnership |
| (8) | Shareholder or partner salary to the extent excessive |
| (9) | Expenses set by the taxpayer without actual payment, or belonging to another period (if they could not be booked in their own period, the next period is allowed) |
| (10) | Remuneration for the company's own assets used by itself |
| (11) | Interest on own capital, reserves or funds |
| (12) | Recoverable losses; tax losses older than 5 years |
| (13) | Expenses not for profit-seeking or not for the business |
| (14) | Expenses not for business in Thailand |
| (15) | Purchase price and related costs in excess of normal without reasonable cause |
| (16) | Depletion of natural resources |
| (17) | Write-down of non-inventory assets (subject to s.65 bis) |
| (18) | Expenses where the payer cannot prove who received the money |
| (19) | Any expense fixed to be paid from profit after the accounting period ends |
| (20) | Similar expenses prescribed by royal decree (RD 315 B.E. 2540 passenger-car caps; RD 504; RD 574) |

### 4.2 Caps and specific rules

**Entertainment** (Ministerial Regulation No. 143; RD Order Por. 56/2538): [RD rd.go.th/fileadmin/user_upload/spreadsheet/description_assureV1_030659.pdf; 2ND PEAK]

- Annual cap = max(0.3% of revenue before any deductions, 0.3% of paid-up capital at period end), and **not more than 10,000,000**.
- Recipients must not be the company's own employees, unless the employee attends as part of their duty.
- Must be approved by a director, partner, manager or authorised person, with evidence.
- **Gifts**: value not more than **2,000 baht per recipient per occasion**; the excess is non-deductible. The 2,000 limit is for gifts, not meals.
- Input VAT on entertainment within the cap is creditable; above the cap it is a cost. [2ND PEAK]

```ts
entertainmentCap = Math.min(Math.max(0.003 * revenue, 0.003 * paidUpCapital), 10_000_000);
```

**Donations**: 2% of net profit for approved public charity plus 2% for approved education/sport. Some recipients carry a **2x** deduction within an overall 10% cap (state schools, state hospitals via e-Donation, sport bodies). New in 2569: RD 806 (Thai Red Cross and medical foundations), RD 809 (educational institutions), RD 810 (sport bodies), all Oct 2569. [STATUTE s.65 ter(3)(b); RD list rd.go.th/21221.html; 2ND PEAK, Simple Balance] Engine: advanced input, default 1x within 2%.

**Passenger cars** (not more than 10 seats under the excise tariff law), RD 315 B.E. 2540: [RD rd.go.th/828.html; rulings 0702/2479 rd.go.th/65127.html, 0702/5756 rd.go.th/38807.html, 0706/11508 rd.go.th/37049.html]

- Purchase: depreciation only on the first **1,000,000** of cost. Exception: cars used solely in a car-rental business.
- Rental or operating lease: deductible up to **36,000 baht per car per month** or **1,200 per car per day**; the cap **includes VAT** (because that input VAT is not creditable). Also applies to 4-door pickups classed as passenger vehicles.
- Input VAT on buying, hire-purchasing, renting or leasing passenger cars, **and on related goods and services (fuel, repairs)** is non-creditable (s.82/5(6) with DG Notice on VAT No. 42 clause 2(1)); it can be expensed for CIT. [RD rd.go.th/23137.html, rd.go.th/24013.html]
- Fuel, tolls, maintenance: deductible when the car is used for the business and evidenced; the personal-use portion is non-deductible under (3)/(13) or is a taxable benefit to the user. [2ND FlowAccount]
- [UNCERTAIN] No EV-specific higher cap was found. Use 1,000,000 for all passenger cars.

**Depreciation** (Royal Decree 145 B.E. 2527 as amended; maximum rates as % of cost per year; pro rata by days in the year of acquisition; leave 1 baht): [RD rd.go.th/828.html, page last updated 2020]

| Asset | Max rate |
|---|---|
| Permanent buildings | 5% |
| Temporary buildings | 100% |
| Cost of acquiring depletable natural resources | 5% |
| Leasehold without term or indefinitely renewable | 10% |
| Leasehold with term | 100 / (lease years including renewals) |
| Intangibles (goodwill, trademark, licence, patent, copyright) with unlimited life | 10% |
| Intangibles with limited life | 100 / years of use |
| Other assets (machinery, vehicles, furniture, equipment; not land or goods) | 20% |
| Computers and accessories including software | written off over **3 accounting periods** (any GAAP method) |

Special allowances on the RD page (confirm currency before enabling):

- SME (fixed assets excluding land not over 200M and not over 200 employees): computers **40% initial**, remainder over 3 periods; factory buildings 25% initial; machinery 40% initial. [RD rd.go.th/828.html; 2ND Simple Balance 2569 still lists the SME computer 40%] [UNCERTAIN whether there is a sunset; treat as an advanced option]
- R&D machinery 40% initial (DG Notice 48). Other entries on that page (cash registers, ROH buildings, flood relief 2554-2555, machinery ready by 2553, SME 100% write-off by 2553) are **expired** or niche.
- The car cap applies on top of the 20% rate (maximum 200,000 per car per year).

**Super deductions and exemptions** (CIT), status for 2568-2569:

| Measure | Benefit | Conditions | Valid | Source |
|---|---|---|---|---|
| e-Tax Invoice & e-Receipt, e-WHT system costs | **2x** on investment and service fees paid to providers (adds the ETDA assessment fee) | any company or juristic partnership | spending 1 Jan 2569 to 31 Dec 2570 (previous round 2566-2568) | RD 808 B.E. 2569 gazetted 12 Oct 2569; cabinet 16 Jun 2569 [RD list; 2ND PEAK, stream.co.th] |
| SME digital transformation | **2x** on software, hardware, smart devices or digital services listed on depa's Digital Service List (computers excluded), for the first **300,000** of spending per accounting period (extra deduction up to 300,000) | SME: paid-up capital not over 5M, revenue not over 30M | spending 24 Jun 2568 to 31 Dec 2570 | RD 802 B.E. 2569 gazetted 6 Feb 2569; DG Notice 469 [RD list; 2ND depa.or.th tax200, kaohoon] |
| Energy-saving equipment, solar rooftop | **1.5x** (income exemption of 50% of the qualifying investment on top of normal depreciation) | company or juristic partnership; certified equipment; no double benefit with BOI/EEC | per DG Notice 471 [UNCERTAIN end date; one vendor says 31 Dec 2571] | RD 805 B.E. 2569 gazetted 2 Mar 2569 [RD list; 2ND massteclink, bangkokbanksme] |
| Employees aged 60+ | wages **2x** | wage not over 15,000 in that month, at most 10% of headcount, Thai, not a current or past shareholder, director or executive | ongoing (periods from 1 Jan 2559) | RD 639 B.E. 2560 [RD newstartup.rd.go.th FAQ; 2ND TDRI] |
| Employee training | **2x** for approved courses | | ongoing | [2ND PEAK, Simple Balance; decree number often cited as RD 437, UNCERTAIN] |
| R&D | 2x in-house; up to **3x** when contracted to RD-listed research providers | | ongoing | RD 598 [2ND Simple Balance; RD research-provider lists 310-315 issued in 2569] |
| Disabled employees | 2x wages (3x in the special case) | | ongoing | RD 499, RD 519 [2ND] |
| Domestic seminars and trade fairs (MICE) | 2x in secondary cities, 1.5x elsewhere (2568 round ended 15 Dec 2568); new 2x for domestic trade-fair booth and service fees approved by cabinet 6 Oct 2569 | e-Tax Invoice required | 2569 decree pending | RD 801; DG Notice 467 [2ND kaohoon.com/news/local/869909] [UNCERTAIN] |
| SME accounting software (old) | actual, up to 100,000 per period | 2564-2565 only | **expired** | RD 725 [RD SME guide] |

Engine recommendation: model super deductions as optional inputs (spend x (multiplier - 1) as an extra deduction), not defaults.

### 4.3 Everyday expense rules for owner-operators

- **Evidence**: the expense must relate to the business (13), be real (9) and have an identifiable payee (18). A full tax invoice is needed only to **credit input VAT**. For CIT, a receipt, or a company-prepared substitute receipt ("ใบรับรองแทนใบเสร็จรับเงิน") with the payee's name, address, ID number and signature plus a transfer slip, is generally accepted. Self-made documents without corroboration have been rejected by the courts under (18). [RD manual rd.go.th/fileadmin/download/15277290359.pdf; 2ND PEAK, Simple Balance]
- **Home office**: deductible only through an arm's-length rental contract with the owner (5.2) or utilities apportioned to business use with evidence; the address should be the registered head office or a registered branch. The personal portion falls under (3)/(13). [STATUTE principle; 2ND]
- **Phone and internet**: deductible for business lines in the company's name or reimbursed with evidence; apportion mixed use. [2ND]
- **Travel**: business travel with a documented purpose is deductible; family members' costs fall under (3). [2ND PEAK: family trips non-deductible]
- **Meals**: staff welfare meals open to all staff are deductible as welfare; client meals are entertainment (cap above); the owner's own meals with no business purpose fall under (3). [2ND]
- **Fines and CIT**: never deductible (6). **Provisions** (bad-debt allowance, warranty provisions, bonus accruals without an obligation): add back under (1)/(9); bad debts are deductible only when written off under Ministerial Regulation 186. [STATUTE; RD 828]

---

## 5. Owner and company transactions

### 5.1 Owner sells personal assets to the company

- Individual: income from selling movable property "inherited, or acquired not for trade or profit" is **exempt** under **s.42(9)**, except ships of 6 tons or more, steamships or motor boats of 5 tons or more, and rafts. A personal computer, phone or car bought for personal use and sold once to the company is exempt; habitual buying and selling is 40(8). [STATUTE rd.go.th/5937.html; 2ND twentyfouraa.com/post/selling-a-personal-car-to-my-own-business, kknaccounting]
- Real estate is different (40(8) with WHT, holding-period deemed expense 92% to 50%, final-tax option under s.48(4), plus SBT or stamp duty and transfer fees). Out of scope.
- VAT: none if the individual is not VAT-registered. If the individual is VAT-registered and the asset was used in the VAT business, the sale is a VAT sale. [2ND tax-ez cites s.42(9) with s.77/2]
- Company: records the asset at the purchase price, which must be **market value**, and depreciates per 4.2 (computer 3 years, car 20% with the 1M cap). Paying above market: the excess is non-deductible under s.65 ter(15). Selling company assets to the owner below market: the assessor can impute market value under s.65 bis(4) (RD example: a car worth 100,000 sold to a manager for 10,000). [STATUTE; RD rd.go.th/828.html]
- No WHT on purchases of goods.

### 5.2 Owner rents property to the company

- Rent received is **s.40(5)** for the owner. Deemed expense (or actual): houses and buildings 30%, agricultural land 20%, other land 15%, **vehicles 30%**, other assets 10%. [RD PND 90 guide 2568 p.4]
- The company withholds **5%** on rent paid to individuals (PND 3) and to companies (PND 53); 5% also applies to car rental without a driver. Rental with a driver is a service at 3%. [2ND PEAK howto-record-rental-expense, billsos]
- The owner reports 40(5) in the half-year **PND 94** (by end September; e-filing to 8 October) and in PND 90. [STATUTE s.56 bis]
- The company deducts rent if arm's-length and for business use. Passenger car rent is capped at 36,000 per month including VAT (4.2). Stamp duty on a lease is 1 baht per 1,000 baht of total rent over the term, paid by the lessor. [2ND aplusme, PEAK]
- Above-market rent to a shareholder: the excess is non-deductible (s.65 ter(15)). Land and building tax effect of using part of a home for business was not researched. [UNCERTAIN]
- Arbitrage for the optimizer: rent R reduces company profit by R (saving the band's combined rate, for example 23.5% in the 15% band) and is taxed at the owner's marginal PIT on 70% of R. Example: owner at 20% marginal, company in the 15% band: company side saves 0.235R; owner pays 0.20 x 0.70R = 0.14R.

### 5.3 Loans between owner and company

- Owner lends to the company: interest is 40(4)(a) for the owner; the company withholds **15%** (PND 2) and the owner may treat it as final. The company deducts interest at a reasonable rate. [STATUTE s.48(3)(a); 2ND billsos]
- Company lends to the owner interest-free or below market: the assessor may impute market interest under **s.65 bis(4)** for CIT, and the deemed interest is also subject to **specific business tax** (lending, s.91/2(5), 3% plus 10% local tax = 3.3%). Show "director loan" as a warning in the UI. [2ND dst.co.th, tax-ez.info/QA/View/Y9pVgfKe; the 3.3% figure is from general knowledge, UNCERTAIN]

### 5.4 Related-party pricing

- Owner and company transactions are tested under the s.65 bis(4) market-price rule (free or below-market transfers, services and loans). [STATUTE]
- Formal transfer-pricing documentation (s.71 bis, s.71 ter) applies to related juristic persons with revenue of 200M or more; not relevant for a small owner-company. [UNCERTAIN, not re-verified]

---

## 6. Company running costs and compliance

### 6.1 Formation (DBD)

- Minimum **2 promoters** for a private limited company since **7 Feb 2566** (CCC Amendment Act No. 23 B.E. 2565, gazetted 8 Nov 2565); also at least 2 shareholders at the statutory meeting and throughout. One-person companies are not yet possible. Par value at least 5 baht; at least 25% of each share paid up at incorporation. [2ND prachachat.net/hilight-prachachat/news-1140176, iTAX]
- Registration fees under the Ministerial Regulation B.E. 2563 (in force 1 Jan 2564). Fees are **flat**, not capital-based: [STATUTE dbd.go.th/data-storage/attachment/561b5f78c634931010a7d26420.PDF]

| Item | Fee (THB) |
|---|---|
| Partnership registration (registered ordinary or limited) | 1,000 |
| Memorandum of association | 500 |
| Company registration | 5,000 |
| Conversion of partnership into company | 5,000 |
| Each later registration (directors, capital increase or decrease, articles, **dissolution**, other matters) | 500 each |
| Registration certificate | 100 per copy |
| Certificate of registered particulars (หนังสือรับรอง) | 40 per item |
| Certified copies | 50 per page |

- The 50% e-Registration discount in that regulation applied **1 Jan 2564 to 31 Dec 2566**. Several 2569 guides still quote an online price of about 2,850 (2,500 + 250 + 100), but no extension instrument was found, and DBD held a hearing on a new draft fee regulation from 12 Mar to 15 Apr 2569. [UNCERTAIN] Engine default: 5,600 for a company (500 + 5,000 + 100), 1,100 for a partnership, with an "online discount" toggle.
- Agent packages: about 3,000 to 9,000 baht. [2ND risklessaccounting, greenproksp]
- The old capital-based formula (500 per 100,000 of capital, minimum 5,000, maximum 250,000) is **obsolete**.

### 6.2 Recurring compliance calendar (calendar-year company)

| Filing | What | Deadline (paper / e-filing) | Source |
|---|---|---|---|
| PND 1 | WHT on salaries and 40(2) fees | 7th of next month / 15th | [2ND smemove, PEAK calendar] |
| PND 1 Kor | annual summary of employee income | end of February (2569: 2 March) | [2ND krungsri calendar] |
| PND 2 | WHT on dividends and interest to individuals | 7th / 15th | [2ND] |
| PND 3 | WHT on services, rent and similar to individuals and non-juristic partnerships | 7th / 15th | [2ND] |
| PND 53 | WHT on payments to juristic persons | 7th / 15th | [2ND] |
| PND 54 | WHT on payments abroad | 7th / 15th | [2ND] |
| PP 30 | monthly VAT return (registrants) | 15th / 23rd | [2ND PEAK] |
| PP 36 | self-assessed VAT on imported services (foreign SaaS, ads) | 7th / 15th | [2ND] |
| SSO | s.33 contributions | 15th of next month | [2ND] |
| PND 51 | half-year CIT | 31 August / +8 days | [RD SME guide] |
| PND 50 | annual CIT with certified statements | 150 days (29 May) / 158 days | [RD SME guide] |
| AGM | approve financial statements | within 4 months of year end (30 April) | [2ND accconsultingservice, DBD manual] |
| บอจ.5 | shareholder list to DBD | within 14 days after the AGM | [2ND] |
| ส.บ.ช.3 + statements | DBD e-Filing | company: within 1 month after AGM approval; registered partnership: within 5 months of year end | [2ND; DBD manual dbd.go.th/data-storage/attachment/10a7ab64d6162d775b5483c410.pdf] |
| ภ.ป.1 | signboard tax, local government | by end of March; new signs within 15 days | [2ND Dharmniti] |

- The **8-day e-filing extension** (PND 1, 2, 3, 53, 54, 50, 51, 90, 91, 94, PP 30, PP 36, PT 40) runs **1 Feb 2567 to 31 Jan 2570** under a Ministry of Finance notice; no renewal found yet. [2ND peakaccount.com/blog/tax/gen-tax/tax-filing-deadline] [UNCERTAIN after Jan 2570]
- Late financial statements: one firm cites fines up to 50,000 per offence for the company (plus directors). [UNCERTAIN; not verified on dbd.go.th]

### 6.3 Audit

- Every limited company needs a **CPA** audit each year. [RD SME guide; 2ND]
- A **registered partnership** (ordinary juristic or limited) with paid-up capital not over **5M**, total assets not over **30M** and total revenue not over **30M** (all three) may use a **Tax Auditor (TA)** instead. [2ND PEAK tax-auditor-ta-vs-cpa, FlowAccount cpa-vs-ta-auditors]
- 2569 market prices for a small entity: CPA audit **8,000 to 30,000** per year (very small or dormant from about 5,000); TA audit **5,000 to 15,000**. [2ND aplusme, risklessaccounting]

### 6.4 Bookkeeping

- Monthly bookkeeping including WHT filings: **1,500 to 3,500** for fewer than about 30 documents and no VAT; **3,000 to 6,000** for 30 to 100 documents or VAT-registered; **6,000 to 15,000** for 31 to 150 documents. Year-end closing and audit are usually billed separately. [2ND setupaccounting.co.th, aplusme]
- Engine defaults: bookkeeping 2,500 per month (no VAT) or 4,000 (VAT); audit 15,000 (company CPA) or 8,000 (partnership TA); miscellaneous 5,000 per year (bank, DBD certificates, stamp duty). Annual total about 50,000 to 70,000.

### 6.5 Other taxes

- **VAT**: registration is mandatory once annual revenue from VAT-able supplies exceeds **1,800,000**; apply (PP 01) **within 30 days** of the day the threshold is crossed. Same rule for individuals and juristic persons; voluntary registration is allowed below the threshold. [2ND FlowAccount, PEAK] Rate **7%** (6.3% plus 0.7% local) extended by **Royal Decree 807 B.E. 2569** (gazetted 24 Aug 2569) to **30 Sep 2570 (2027)**; statutory rate 10%. The previous extension was RD 799 to 30 Sep 2569. [RD list rd.go.th/21221.html; 2ND KPMG taxnewsflash 2026/09]
  - VAT is neutral between the personal and company forms (same threshold).
- **Specific business tax**: not applicable to ordinary services or trading; relevant to lending (including deemed interest, 5.3), real estate sold within 5 years, banking. [STATUTE s.91/2]
- **Stamp duty**: lease of land or buildings 1 per 1,000 of total rent; hire of work 1 per 1,000 of contract value; share transfer 1 per 1,000 of paid-up or nominal value, whichever is higher. Large contracts and electronic instruments go through e-Stamp. [2ND PEAK, aplusme; share-transfer rate UNCERTAIN]
- **Signboard tax** (MR B.E. 2563, from 1 Jan 2564), per 500 sq cm: Thai only 5 (static) or 10 (moving); Thai with foreign text 26 or 52; no Thai, or Thai below foreign text, 50 or 52; minimum 200 per sign per year. [2ND dharmniti.co.th/sign-tax-rates-for-the-year-2026]

### 6.6 Closing a company

- DBD: dissolution registration 500 and liquidation completion 500 ("other registrations" at 500 each under the 2563 regulation). Newspaper notice 500 to 2,000. Audit of the liquidation-date statements 5,000 to 50,000. Full-service closure 15,000 to 30,000 plus audits. The RD often audits before liquidation can complete; liquidation lasting over 1 year requires progress reports. [STATUTE fee MR; 2ND greenproksp, accountingth]
- Engine default: one-off closing cost 30,000 (optional).
- Distributions above paid-up capital on liquidation are treated like dividends to shareholders. [UNCERTAIN, not separately verified]

---

## 7. Natural person and unregistered partnership

### 7.1 PIT rates, tax years 2568 and 2569 (unchanged) [RD PND 90 guide 2568, Table 1]

| Net income | Rate | Cumulative tax at top of band |
|---|---|---|
| 0 to 150,000 | 0% | 0 |
| 150,001 to 300,000 | 5% | 7,500 |
| 300,001 to 500,000 | 10% | 27,500 |
| 500,001 to 750,000 | 15% | 65,000 |
| 750,001 to 1,000,000 | 20% | 115,000 |
| 1,000,001 to 2,000,000 | 25% | 365,000 |
| 2,000,001 to 5,000,000 | 30% | 1,265,000 |
| above 5,000,000 | 35% | |

Personal allowance 60,000; spouse without income 60,000. (The full allowance list is out of scope for this file.) [STATUTE s.47(1)]

### 7.2 Deemed expense by income type [STATUTE s.42 bis; RD 11 B.E. 2502 ss.6, 8, 8 bis at rd.go.th/2375.html; RD PND 90 guide 2568]

| Type | Deemed expense |
|---|---|
| 40(1) + 40(2) combined | 50%, max **100,000** combined |
| 40(5) rent | buildings 30%, agricultural land 20%, other land 15%, vehicles 30%, other 10% (or actual) |
| 40(6) professions | **healing arts and fine arts 60%**; law, engineering, architecture, accounting 30% (or actual). Fine arts moved from 30% to 60% from tax year 2568 (RD 803 B.E. 2569, gazetted 6 Feb 2569) |
| 40(7) contract work where the contractor supplies major materials | 60% (or actual) |
| 40(8) business listed in RD 11 s.8, items (1) to (42) | **60%** (or actual) |
| 40(8) item (43), performers and professional athletes | 60% on the first 300,000, 40% on the rest, total capped at 600,000 (RD 629) |
| 40(8) not listed in s.8 | **actual necessary and reasonable expenses only** (s.8 bis) |

UI note: the 60% for 40(8) applies only to the listed trades (for example (7) hotels, restaurants, food; (15) transport; (25) selling goods the seller did not produce; listed manufacturing). Unlisted 40(8) businesses (for example a consulting firm with staff) get actual expenses only. Many freelancers' fees are 40(2) (hire of services: 50% capped at 100,000) rather than 40(8). Engine: the user picks the income type; show "40(8) listed" and "40(8) unlisted" as separate choices.

### 7.3 Minimum tax (s.48(2))

- Anyone with assessable income (excluding 40(1)) of 120,000 or more computes tax two ways: (1) progressive tax on net income; (2) 0.5% of total assessable income **excluding 40(1)**; and pays the higher. Method 2 is waived if it is 5,000 or less (RD 480 B.E. 2552), so it only bites when non-40(1) assessable income exceeds 1,000,000. [STATUTE rd.go.th/5937.html; RD PND 90 guide 2568]
- 40(2) director fees and dividends included in PND 90 (grossed up) count toward the base.

```ts
const minTax = nonSalaryAssessable * 0.005;           // excludes 40(1)
const tax = Math.max(progressiveTax, minTax > 5_000 ? minTax : 0);
```

### 7.4 Half-year PND 94

40(5) to 40(8) income received January to June is filed by end September (e-filing to 8 October) with half allowances and credited against PND 90. [STATUTE s.56 bis] Cash-flow only; optional for the engine.

### 7.5 Unregistered ordinary partnership or group of persons (ห้างหุ้นส่วนสามัญ / คณะบุคคลที่มิใช่นิติบุคคล)

No 2023 change was found. The relevant change dates from 2015:

1. **Entity level**: the partnership or group is a separate PIT unit. The manager files PND 90/94 in its name and pays PIT on its total assessable income "as if a single individual", with normal deemed or actual expenses per income type, the 0.5% minimum tax and progressive rates. [STATUTE s.56 para 2]
   - Allowance: 60,000 for **each resident partner or member, capped at 120,000 in total**, plus donations up to 10% of income after expenses and allowances. No spouse, child, insurance, mortgage-interest or other personal allowances. [STATUTE s.47(6); RD manual rd.go.th/fileadmin/download/insight_pasi/manualpasi_120159.pdf (its 30,000 and 60,000 figures predate Act No. 44 B.E. 2560)]
2. **Partner level**: since **1 Jan 2558 (2015)**, profit shares distributed to partners are **s.40(8) income** of each partner, added to their other income in PND 90. The previous exemption (s.42(14)) was repealed by Revenue Code Amendment Act **No. 39 B.E. 2557**. **No credit** is given for the PIT the partnership already paid, so the profit is taxed twice. [RD Order Por. 149/2558 (tax-ez.info/Revenue/View/fLvj3CJN); RD manual worked example; 2ND thaipublica 2015, dharmniti]
   - The partner's share is not a listed RD 11 trade: the RD worked example deducts **no expense** from it. The RD FAQ allows only expenses related to the partner's investment in the partnership, in the year paid. [RD FAQ rd.go.th/fileadmin/user_upload/kormor/10279.pdf Q3; manual example]
   - Distribution is not compulsory: the partnership may distribute all, part or none of a year's profit; accumulated profits are fully 40(8) when paid out later. Using partnership money for the partners' common (family) expenses counts as distribution. [RD FAQ Q6, Q11, Q12]
   - Carve-outs (Por. 149/2558 and the later relief for family groups): shares attributable to 40(4)(a)(b)(g) income and to 40(8) sales of inherited or non-trading real estate on which WHT was withheld; profit shares from family property rental and bank deposit interest (Ministerial Regulation 126 clause 2(89), applied pro rata, RD ruling 0702/824, rd.go.th/66127.html). Not relevant to service or trading businesses. [RD; 2ND dlo.co.th/news/2531]
3. Payments to an unregistered partnership are withheld at individual rates on PND 3. [2ND]

Engine consequence: for an operating business an unregistered partnership is almost always **worse** than the partners each earning the income personally, and worse than a juristic entity once profit is distributed. Model: `tax = pitPartnership(income) + sum(pitPartner(otherIncome_i + share_i))`, with `share_i = distributionRatio * cashProfitAfterPartnershipTax * ownership_i`.

### 7.6 Registered ordinary partnership and limited partnership (ห้างหุ้นส่วนสามัญนิติบุคคล / ห้างหุ้นส่วนจำกัด)

- Juristic persons with **the same CIT rules and SME rates as a company** (the decrees say "บริษัทหรือห้างหุ้นส่วนนิติบุคคล"). [STATUTE RD 530]
- Profit shares to partners are 40(4)(b) with 10% WHT, the final-tax option and the s.47 bis credit, the same as dividends. [STATUTE s.47 bis and s.48(3) wording]
- Differences from a company: at least 2 partners; a limited partnership needs at least one unlimited-liability partner who is personally liable for all debts; DBD fee 1,000; a TA auditor is allowed if small (6.3); no บอจ.5; statements to DBD within 5 months; no statutory legal reserve [UNCERTAIN]; partner salary deductible subject to s.65 ter(8); partner drawings without consideration non-deductible (s.65 ter(7)). [2ND PEAK limited-partnership-thailand]
- Engine: treat as `company` with TA audit cost, `legalReserve = false`, and an "unlimited liability" warning.

---

## 8. Optimizer logic and worked examples

### 8.1 What Thai tax sites do

The usual heuristic (iTAX, PEAK, accounting firms): pay the owner a salary until the owner's **marginal PIT rate on salary** reaches the **combined marginal rate on company profit paid out as a dividend**, then pay the rest as a dividend and choose final 10% vs inclusion. Combined rates on distributed profit:

| Company profit band | CIT | Plus 10% final dividend tax | Combined |
|---|---|---|---|
| 0 to 300,000 (SME) | 0% | 10% | **10%** |
| 300,001 to 3,000,000 (SME) | 15% | 0.85 x 10% | **23.5%** |
| above 3,000,000, or non-SME | 20% | 0.80 x 10% | **28%** |

So keep adding salary while the marginal PIT on salary (after the 100,000 expense and allowances) is below the combined rate of the band the salary is coming out of:

- Large SME profit: salary up to the top of the **20%** PIT bracket (net income 1,000,000, gross salary about 1,160,000 with only the personal allowance), because 20% < 23.5% and 25% > 23.5%.
- If that would pull company profit below 300,000, the 0% band (10% combined) is worth keeping: stop where the PIT marginal rate reaches 10% or 15%.
- If company profit exceeds 3,000,000: salary taxed at 25% beats leaving profit in the 28% band, but salary at 30% does not, so salary first brings company profit down to 3,000,000.

Do not rely on the heuristic: brute-force the salary in steps (1,000 or 10,000), and for each step compute CIT, legal reserve, dividend, both dividend options, minimum tax, SSO and running costs; pick the minimum total tax plus cost (or maximum owner cash), subject to a reasonableness cap on salary.

### 8.2 Reference algorithm

```ts
function companyScenario(input, salary) {
  const sso = input.ownerInSso33 ? ssoEach(salary, input.year) : 0;     // per side, annual
  const preTax = input.revenue - input.businessExpenses - input.companyAdminCost
               - salary - sso + input.addBacks - input.extraDeductions;
  const cit = input.isSme ? smeCit(preTax) : 0.20 * Math.max(preTax, 0);
  const afterTax = preTax - cit;
  const reserve = legalReserve(afterTax, input.registeredCapital, input.reserveBalance);
  const dividend = Math.max(afterTax - reserve - input.retainTarget, 0);
  const credit = dividendCredit(dividend, preTax);                       // section 2.2
  const salaryNet = salary - Math.min(0.5 * salary, 100_000);
  const allowances = input.personalAllowances + sso;
  const optA = pit(Math.max(salaryNet + input.otherNetIncome - allowances, 0)) + 0.10 * dividend;
  const grossUp = dividend + credit;
  const pitB = Math.max(
    pit(Math.max(salaryNet + grossUp + input.otherNetIncome - allowances, 0)),
    minTax(grossUp + input.otherNonSalaryAssessable));
  const optB = pitB - credit;                // the 10% WHT is a prepayment inside pitB
  const ownerTax = Math.min(optA, optB);
  return { cit, ownerTax, total: cit + ownerTax, dividend, reserve, credit,
           cash: salary + dividend - ownerTax - sso };
}
```

Compare against the personal scenario on the same revenue and expenses, using the correct income type (40(2), 40(6), 40(8) listed or unlisted), allowances and minimum tax. Show total tax, compliance cost, owner cash, money retained in the company (reserve), and the break-even profit.

### 8.3 Worked examples (validation fixtures)

Common assumptions: tax year 2569, single owner, personal allowance 60,000 only, no SSO, no other income. The company is a new SME, registered capital 1,000,000, reserve balance 0, admin cost 56,000 per year (bookkeeping 36,000 + audit 15,000 + miscellaneous 5,000), all post-reserve profit distributed in the same year, dividend credit by pro-rata averaging. Values come from a reference script; round only for display.

**E1. Individual, 40(2) service fees 2,000,000, no expenses**

- Expense min(50% x 2,000,000, 100,000) = 100,000. Net = 2,000,000 - 100,000 - 60,000 = 1,840,000.
- PIT = 115,000 + 840,000 x 25% = **325,000**. Minimum tax 0.5% x 2,000,000 = 10,000 (lower). Owner cash 1,675,000.

**E2. Individual, 40(6) law, engineering or accounting fees 2,000,000 (30% deemed)**

- Net = 2,000,000 - 600,000 - 60,000 = 1,340,000. PIT = 115,000 + 340,000 x 25% = **200,000**.

**E3. Individual, 40(8) listed trade (for example selling goods), revenue 3,000,000, actual expenses 1,000,000 (net profit 2,000,000)**

- Deemed 60% = 1,800,000 > actual 1,000,000, so deemed is used. Net = 3,000,000 - 1,800,000 - 60,000 = 1,140,000.
- PIT = 115,000 + 140,000 x 25% = **150,000**. Minimum tax 0.5% x 3,000,000 = 15,000 (lower).
- Same business as **unlisted** 40(8) (actual only): net = 2,000,000 - 60,000 = 1,940,000; PIT = 115,000 + 940,000 x 25% = **350,000**.

**E4. Company with 2,000,000 profit before owner pay (E1 or E3 moved into the company), by salary**

Company pre-tax profit = 2,000,000 - 56,000 - salary.

| Salary | Co. profit | CIT | Reserve | Dividend | Credit | Owner tax, final 10% | Owner tax, include | Best | Total tax (CIT + owner) | Owner cash |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1,944,000 | 246,600 | 84,870 | 1,612,530 | 234,270 | 161,253 | 77,430 | include | 324,030 | 1,535,100 |
| 300,000 | 1,644,000 | 201,600 | 72,120 | 1,370,280 | 191,520 | 137,028 | 98,930 | include | 300,530 | 1,571,350 |
| 600,000 | 1,344,000 | 156,600 | 59,370 | 1,128,030 | 148,770 | 134,303 | 145,430 | final | 290,903 | 1,593,727 |
| 1,000,000 | 944,000 | 96,600 | 42,370 | 805,030 | 91,770 | 163,503 | 207,430 | final | 260,103 | 1,641,527 |
| **1,160,000 (optimum)** | 784,000 | 72,600 | 35,570 | 675,830 | 68,970 | 182,583 | 232,230 | final | **255,183** | **1,653,247** |
| 1,200,000 | 744,000 | 66,600 | 33,870 | 643,530 | 63,270 | 189,353 | 238,430 | final | 255,953 | 1,654,177 |

Optimum detail (salary 1,160,000): salary net income 1,160,000 - 100,000 - 60,000 = 1,000,000, PIT 115,000. CIT = (784,000 - 300,000) x 15% = 72,600. Reserve 5% x 711,400 = 35,570. Dividend 675,830, final WHT 67,583. Total tax 255,183; plus admin 56,000 = **311,183** all-in. Owner cash 1,653,247, plus 35,570 kept in the company reserve.

(Salary 1,200,000 gives slightly more cash because it lowers the reserve allocation. The objective function decides: minimise tax plus cost, or maximise owner cash with or without the retained reserve.)

Comparison:

- vs E1 (40(2), tax 325,000, cash 1,675,000): company all-in 311,183; owner cash 1,653,247 + 35,570 reserve = 1,688,817. The company wins by only about 14,000 per year before formation cost and effort; without the 56,000 admin cost it would win by about 70,000.
- vs E3 (40(8) listed, tax 150,000): the company loses by about 160,000 per year. The 60% deemed expense dominates.
- vs E3 unlisted (350,000): the company wins by about 39,000 plus the reserve.

**E5. Scale effect, 40(2)-type income with no expenses**

| Profit before owner pay | Individual 40(2) tax | Company optimum salary | Company total tax | Plus admin 56,000 | Winner |
|---|---|---|---|---|---|
| 1,000,000 | 83,000 | 650,000 (company profit 294,000, 0% band) | 54,430 | 110,430 | Individual |
| 2,000,000 | 325,000 | 1,160,000 | 255,183 | 311,183 | Company (small margin) |
| 5,000,000 | 1,217,000 | 1,950,000 (company profit 2,994,000, stays in the 15% band) | 965,590 | 1,021,590 | Company (about 195,000) |

**E6. Unregistered partnership, 2 equal partners, 40(8) listed trade, revenue 3,000,000, actual expenses 1,000,000, full distribution, no other income**

- Partnership PIT: net = 3,000,000 - 1,800,000 (60%) - 120,000 (2 x 60,000) = 1,080,000; tax = 115,000 + 80,000 x 25% = 135,000.
- Cash distributed = 3,000,000 - 1,000,000 - 135,000 = 1,865,000, i.e. 932,500 each as 40(8) with no expense.
- Each partner: net 932,500 - 60,000 = 872,500; PIT = 65,000 + 122,500 x 20% = 89,500 (minimum tax 4,662.50, waived as not over 5,000). Both partners 179,000.
- Total **314,000**, versus each partner earning 1,500,000 revenue personally: net 1,500,000 x 40% - 60,000 = 540,000; PIT 27,500 + 40,000 x 15% = 33,500 each, **67,000** in total.

**D1** (dividend credit) is in section 2.2.

---

## 9. Withholding tax rates (payer is a company or juristic partnership)

Based on RD Order Tor.Por. 4/2528 as summarised by [2ND billsos.com/guide/withholding-tax-rates (Jun 2026), PEAK, thaicore]; dividend and interest rates from the Code.

| Payment | To individual (PND 3, or PND 1/2) | To Thai juristic person (PND 53) |
|---|---|---|
| Salary, wages 40(1) | progressive, PND 1 | n/a |
| Director fees, commissions to non-employees 40(2) | progressive under s.50(1), PND 1 | 3% (commission) |
| Services, hire of work 40(7)/(8) | **3%** | **3%** |
| Professional fees 40(6) | 3% | 3% |
| Rent of property; car rental without driver | **5%** | **5%** |
| Advertising | **2%** | **2%** |
| Transport (non-public) | **1%** | **1%** |
| Prizes and contest awards | 5% | 5% |
| Resident public entertainers | 5% | n/a |
| Non-life insurance premiums | n/a | 1% |
| Interest | 15% (PND 2) | 1% |
| Dividends, profit shares | 10% (PND 2) | 10% |

- Company to company services: **3%** (not 1%). The only 1% rates are transport, insurance premiums, interest to companies, and e-WHT.
- No WHT on a contract whose total is under **1,000 baht**; contracts expected to reach 1,000 or more need WHT on every instalment. [Tor.Por. 4/2528 clause 12/7 via billsos]
- Purchases of goods: no WHT.
- Payments to unregistered partnerships and groups of persons: individual rates, PND 3.
- **e-Withholding Tax**: payments made through the bank-integrated e-WHT system are withheld at **1%** instead of 5%, 3% or 2%, for payments **1 Jan 2569 to 31 Dec 2570**, to juristic persons (excluding foundations and associations) and individuals, under **Ministerial Regulation No. 402 B.E. 2569** (gazetted 9 Oct 2569, amending MR 144). Previous round: 1 Jan 2566 to 31 Dec 2568. An interim notice let payers who used e-WHT between 1 Jan and 31 Mar 2569 remit any top-up by 30 Apr 2569. Dividends (10%) and transport (already 1%) are unchanged. [RD list rd.go.th/21221.html (mr402.pdf, mfeWHTA.pdf); 2ND bangkokpost 3271861, panyaplus.com, hlbthai.com]

---

## 10. 2569 measures relevant to SMEs (status at 2026-11-04)

From the RD new-laws list (rd.go.th/21221.html) and news:

1. **SME CIT rates 0/15/20** unchanged for accounting periods in 2568 and 2569. No new rate cut found.
2. **VAT 7%** extended to 30 Sep 2570 (RD 807, gazetted 24 Aug 2569).
3. **e-WHT 1%** for 2569-2570 (MR 402, gazetted 9 Oct 2569) and the **2x deduction for e-Tax and e-WHT system costs** for 2569-2570 (RD 808, gazetted 12 Oct 2569).
4. **SME digital transformation 2x on up to 300,000 of spending** (RD 802, gazetted 6 Feb 2569; spending 24 Jun 2568 to 31 Dec 2570; criteria in DG Notice 469).
5. **Solar rooftop and energy-efficient equipment 1.5x** for businesses, and a personal deduction up to 200,000 for households (RD 805, gazetted 2 Mar 2569; DG Notices 470 and 471).
6. **Fine-arts professionals**: 40(6) deemed expense 60% from tax year 2568 (RD 803, gazetted 6 Feb 2569).
7. **Donations**: new or renewed 2x regimes (RD 806, 809, 810, Oct 2569).
8. **MICE / trade-fair 2x**: cabinet approval 6 Oct 2569 for domestic trade-fair booth and service fees; decree not yet on the RD list. [UNCERTAIN]
9. **SSO wage ceiling** 17,500 from 1 Jan 2569 (max 875 per side per month).
10. **Easy E-Receipt** (personal): no 2569 round confirmed (parliament dissolved early 2569); the last confirmed round was 16 Jan to 28 Feb 2568, up to 50,000. [UNCERTAIN; personal measure]
11. Penalty-waiver criteria for s.67 ter and other surcharges updated by Tor.Por. 369/2569 (content not extracted). [UNCERTAIN]
12. The 8-day e-filing extension expires 31 Jan 2570 unless renewed. [UNCERTAIN]

---

## 11. Constants for the engine

```ts
export const TH_COMPANY_RULES_2569 = {
  cit: {
    standardRate: 0.20,
    sme: {
      capitalMax: 5_000_000, revenueMax: 30_000_000, neverExceededSince: 2012,
      bands: [{ upTo: 300_000, rate: 0 }, { upTo: 3_000_000, rate: 0.15 }, { upTo: Infinity, rate: 0.20 }],
    },
    lossCarryForwardYears: 5,
    pnd51: { underestimateThreshold: 0.25, surcharge: 0.20 },
    latePaymentSurchargePerMonth: 0.015,
    pnd50DaysAfterYearEnd: 150,
    eFilingExtraDays: 8, // valid to 2027-01-31
  },
  dividend: {
    whtRate: 0.10,
    creditFraction: (citRate: number) => citRate / (1 - citRate), // 0.15 -> 3/17, 0.20 -> 1/4, 0 -> 0
    legalReserve: { perDistributionPctOfProfit: 0.05, capPctOfRegisteredCapital: 0.10 },
  },
  pit: {
    brackets: [[150_000, 0], [300_000, 0.05], [500_000, 0.10], [750_000, 0.15],
               [1_000_000, 0.20], [2_000_000, 0.25], [5_000_000, 0.30], [Infinity, 0.35]],
    personalAllowance: 60_000,
    employmentExpense: { rate: 0.5, cap: 100_000 },          // 40(1) + 40(2) combined
    rentDeemed: { building: 0.30, agriLand: 0.20, otherLand: 0.15, vehicle: 0.30, other: 0.10 },
    professionDeemed: { healingArts: 0.60, fineArts: 0.60, other: 0.30 },
    contractWithMaterials40_7: 0.60,
    business40_8Listed: 0.60,                                // RD 11 s.8 items (1)-(42)
    performer40_8: { firstTier: 300_000, firstRate: 0.60, restRate: 0.40, cap: 600_000 },
    minimumTax: { rate: 0.005, waivedIfNotOver: 5_000 },     // base excludes 40(1)
    dividendFinalRate: 0.10,
    partnershipAllowancePerPartner: 60_000,
    partnershipAllowanceCap: 120_000,
  },
  sso: {
    rateEach: 0.05, wageFloor: 1_650,
    ceilings: [
      { from: '2025-01-01', ceiling: 15_000 }, { from: '2026-01-01', ceiling: 17_500 },
      { from: '2029-01-01', ceiling: 20_000 }, { from: '2032-01-01', ceiling: 23_000 },
    ],
    section39Monthly: 432,
    section40Monthly: { option1: 70, option2: 100, option3: 300 },
    ownerEligibleDefault: false,
  },
  expenses: {
    entertainment: { pctOfRevenueOrCapital: 0.003, absCap: 10_000_000, giftPerPersonPerOccasion: 2_000 },
    donations: { charityPctOfNetProfit: 0.02, educationSportExtraPct: 0.02, politicalPartyCap: 50_000 },
    passengerCar: { depreciableCostCap: 1_000_000, rentPerMonthCap: 36_000, rentPerDayCap: 1_200,
                    inputVatCreditable: false },
    depreciation: { building: 0.05, other: 0.20, computerYears: 3, smeComputerInitial: 0.40 },
  },
  superDeductions: {
    eTaxSystems: { multiplier: 2, from: '2026-01-01', to: '2027-12-31' },
    smeDigital: { multiplier: 2, spendCapPerPeriod: 300_000, from: '2025-06-24', to: '2027-12-31' },
    energySaving: { multiplier: 1.5 },
    elderlyWages: { multiplier: 2, wageCapPerMonth: 15_000, maxShareOfHeadcount: 0.10 },
    training: { multiplier: 2 },
    rdContracted: { multiplier: 3 },
    disabledWages: { multiplier: 2 },
  },
  wht: {
    service: 0.03, profession: 0.03, rent: 0.05, advertising: 0.02, transport: 0.01, prize: 0.05,
    interestIndividual: 0.15, interestCompany: 0.01, dividend: 0.10, minContract: 1_000,
    eWht: { rate: 0.01, from: '2026-01-01', to: '2027-12-31' },
  },
  vat: { rate: 0.07, rateValidUntil: '2027-09-30', registrationThreshold: 1_800_000, registerWithinDays: 30 },
  dbdFees: {
    companyRegistration: 5_000, memorandum: 500, certificate: 100, partnershipRegistration: 1_000,
    perChange: 500, dissolution: 500, liquidationCompletion: 500,
    onlineDiscount: 0, // 0.5 applied 2021-2023 only; renewal unconfirmed
  },
  runningCostDefaults: {
    bookkeepingMonthly: 2_500, bookkeepingMonthlyVat: 4_000,
    auditCpa: 15_000, auditTa: 8_000, misc: 5_000, closing: 30_000,
  },
} as const;
```

---

## 12. Items not confirmed

1. Whether the SME rate is lost permanently after any period end above 5M capital or 30M revenue since 2012 (statute and RD guide say yes; some blogs say it returns). Expose as a flag.
2. Content of RD Order Tor.Por. 369/2569 on waiving the s.67 ter surcharge.
3. Whether a shareholder-director can validly be an SSO s.33 insured person; no SSO circular or court decision number found.
4. Section 40 SSO entry-age ceiling (60 vs 65).
5. Whether DBD's 50% online-registration discount was renewed after 31 Dec 2566 (a new fee regulation was in public hearing in March and April 2569).
6. Exact DBD fines for late financial statements and บอจ.5.
7. End date of the RD 805 energy-saving 1.5x window; decree numbers for the 2x training (RD 437 commonly cited) and 3x R&D (RD 598) deductions; whether the SME 40% initial computer allowance has a sunset.
8. The 2569 MICE / trade-fair 2x decree (cabinet-approved 6 Oct 2569, not yet gazetted on the RD list).
9. A company deduction for buying Thai visual art (a secondary source cites RD 803, but RD 803 on the RD list is the artists' deemed-expense decree).
10. No statutory legal reserve for registered partnerships (inferred from CCC structure).
11. Share-transfer stamp duty rate and the 3.3% SBT on deemed interest (stated from general knowledge).
12. Renewal of the 8-day e-filing extension beyond 31 Jan 2570.
13. Any EV-specific passenger-car depreciation cap (none found; use 1,000,000).
14. Easy E-Receipt for 2569 (personal side).
15. Tax treatment of liquidation surplus distributions (assumed dividend-like 40(4)(b)).
16. The full text of RD 802, 803, 805 and 808 PDFs could not be machine-read (font encoding); their content here comes from the RD list titles plus secondary summaries.

---

## Sources

Primary (Revenue Department, DBD, Royal Gazette):

- Revenue Code ss.38-64 (s.40, 42, 42 bis, 47, 47 bis, 48, 50, 56): https://www.rd.go.th/5937.html
- Revenue Code ss.65-76 (s.65 bis, 65 ter, 67 bis, 67 ter, 68, 69): https://www.rd.go.th/5939.html
- RD SME CIT guide (rates, PND 51/50, penalties): https://www.rd.go.th/fileadmin/user_upload/SMEs/infographic/SME_lv3_2.pdf
- Royal Decree 530 B.E. 2554: https://www.rd.go.th/28271.html
- s.65 bis conditions and depreciation: https://www.rd.go.th/828.html
- Royal Decree 11 B.E. 2502 (deemed expenses): https://www.rd.go.th/2375.html
- PND 90 instructions, tax year 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Ins90_241268.pdf
- Order Por. 119/2545 (dividend credit): https://www.rd.go.th/11162.html
- Entertainment expense guide: https://www.rd.go.th/fileadmin/user_upload/spreadsheet/description_assureV1_030659.pdf
- Partnership tax manual: https://www.rd.go.th/fileadmin/download/insight_pasi/manualpasi_120159.pdf
- Partnership FAQ: https://www.rd.go.th/fileadmin/user_upload/kormor/10279.pdf
- Ruling 0702/824 (co-owned rental): https://www.rd.go.th/66127.html
- Passenger car rulings: https://www.rd.go.th/65127.html, https://www.rd.go.th/38807.html, https://www.rd.go.th/37049.html, https://www.rd.go.th/23137.html, https://www.rd.go.th/24013.html
- Documents for deductible expenses: https://www.rd.go.th/fileadmin/download/15277290359.pdf
- RD new-laws list (RD 802, 803, 805, 806, 807, 808, 809, 810, MR 402, Tor.Por. 369/2569): https://www.rd.go.th/21221.html
- Elderly hiring FAQ: https://newstartup.rd.go.th/taxdeduct/index_qanda.jsp
- DBD fee Ministerial Regulation B.E. 2563: https://www.dbd.go.th/data-storage/attachment/561b5f78c634931010a7d26420.PDF
- DBD financial statement filing manual: https://www.dbd.go.th/data-storage/attachment/10a7ab64d6162d775b5483c410.pdf
- depa 200% measure: https://www.depa.or.th/th/thailanddigitalcatalog/tax200

Secondary:

- PEAK: https://www.peakaccount.com/blog/tax/corporate-income-tax/tax-reduction-for-smes, https://www.peakaccount.com/blog/tax/gen-tax/tax-expenses, https://www.peakaccount.com/blog/tax/gen-tax/tax-filing-deadline, https://www.peakaccount.com/blog/accounting/gen-acct/tax-auditor-ta-vs-cpa, https://www.peakaccount.com/blog/accounting/gen-acct/howto-record-rental-expense, https://www.peakaccount.com/blog/business/smes/limited-partnership-thailand
- FlowAccount: https://flowaccount.com/blog/corporate-income-tax-thailand/, https://flowaccount.com/blog/cpa-vs-ta-auditors/, https://flowaccount.com/blog/revenue-over-1-8-million-not-vat-registered/, https://flowaccount.com/blog/car-used-in-business-vat-cit/
- iTAX dividend credit: https://www.itax.in.th/pedia/%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%94%E0%B8%B4%E0%B8%95%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B5%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%9B%E0%B8%B1%E0%B8%99%E0%B8%9C%E0%B8%A5/
- tax-ez: SME capital reduction https://tax-ez.info/QA/View/7pdd08wm ; PND 51 reasonable cause https://tax-ez.info/QA/View/6KAU8yq8 ; Order Por. 149/2558 https://tax-ez.info/Revenue/View/fLvj3CJN/ ; director loans https://tax-ez.info/QA/View/Y9pVgfKe/
- Dailynews SME rate column: https://www.dailynews.co.th/news/2169283/
- Simple Balance 2569 deductions: https://simplebalance.co.th/blog/corporate-tax-deduction/
- SSO ceiling: https://www.prachachat.net/sd/sdplus-hr/news-1936370, https://www.dlapiper.com/en/insights/publications/2025/12/thailands-new-social-security-wage-ceilings-has-officially-published
- SSO s.39/40: https://policywatch.thaipbs.or.th/article/life-21, https://www.krungsri.com/th/krungsri-the-coach/life/good-life/social-security-33-salary-rights-benefits
- Directors and SSO: https://zerotoprofit.co/can-company-directors-register-for-social-security/, https://accprotax.com/social-security-director/
- VAT extension: https://kpmg.com/us/en/taxnewsflash/news/2026/09/thailand-reduced-7-percent-vat-rate-extended-through-september-2027.html
- e-WHT: https://www.bangkokpost.com/business/general/3271861/cabinet-extends-ewithholding-tax-cut-through-2027, https://panyaplus.com/en/guides/withholding-tax-rates, https://www.hlbthai.com/cabinet-approves-extension-of-tax-measures-to-end-of-2027-to-promote-adoption-of-electronic-tax-systems/
- WHT table: https://billsos.com/guide/withholding-tax-rates
- Two promoters: https://www.prachachat.net/hilight-prachachat/news-1140176
- Accounting and audit prices: https://setupaccounting.co.th/blog/register-company-cost-2026/, https://aplusme.org/blog/monthly-accounting-service-what-to-know.html, https://risklessaccounting.com/auditing-services/
- Closing costs: https://www.greenproksp.com/blog/accounting/how-to-dissolve-a-company/, https://accountingth.com/services/company-dissolution
- Signboard tax: https://www.dharmniti.co.th/sign-tax-rates-for-the-year-2026/
- Partnership double tax: https://thaipublica.org/2015/04/personal-income-tax-structure-26/, https://www.dharmniti.co.th/group-of-persons-tax/, https://www.dlo.co.th/news/2531
- Selling a personal car to one's own company: https://www.twentyfouraa.com/post/selling-a-personal-car-to-my-own-business
- Director loans: https://www.dst.co.th/index.php?option=com_content&view=article&id=3867
- Director salary reasonableness: https://accprotax.com/director-salary/
- Legal reserve: https://deka.in.th/laws/ccc/1202
- Solar 1.5x: https://www.massteclink.com/knowledge/solar-for-corporate-2026/, https://bangkokbanksme.com/sme-knowledge/sme-update/tax-incentive-energy-saving-equipment
- Fine arts 60%: https://thestandard.co/govt-tax-measures-art/
- MICE 2x: https://www.kaohoon.com/news/local/869909
