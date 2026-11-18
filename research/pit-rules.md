# Thai Personal Income Tax (PIT) rules: implementation spec

Tax years covered: **2568** (calendar 2025, filed 1 Jan to 31 Mar 2569) and **2569** (calendar 2026, filed 1 Jan to 31 Mar 2570, current year).
Research date: 4 Nov 2026 (2569). Prepared for the calculator engine in `src/tax/`.

## 0. How to read this file

Status tags used on every rule:

| Tag | Meaning |
|---|---|
| `[P]` | Confirmed in a primary source: Revenue Department (RD) form, instructions, Royal Decree (พ.ร.ฎ.), Ministerial Regulation (กฎกระทรวง), Director-General notification (ประกาศอธิบดี), Royal Gazette |
| `[S]` | Confirmed by reliable secondary sources (bank, AMC, Big4, iTAX, major Thai press) but primary text not read in this session |
| `[PENDING]` | Approved by Cabinet or proposed, but no law in force as of 4 Nov 2026 |
| `[UNCONFIRMED]` | Could not verify. Do not hardcode without a review flag |

The single most authoritative document for 2568 is the RD instruction booklet for ภ.ง.ด.90 tax year 2568 (`Ins90_241268.pdf`, printed Dec 2568). For 2569 the most recent RD booklet is the ภ.ง.ด.94 (half-year) instructions for tax year 2569 (`Ins94_160669.pdf`), which lists every allowance in force during 2569. The full-year 2569 ภ.ง.ด.90/91 booklet will only be published around Dec 2569; anything new announced after 4 Nov 2026 must be added then.

All amounts are THB. "Assessable income" = เงินได้พึงประเมิน (gross, before expenses).

---

## 1. Calculation pipeline (order is mandatory)

This is the order of the PND 90 form, ข้อ 11 การคำนวณภาษี `[P]` (form `241268PIT90.pdf`). Build the engine as exactly this sequence.

```
Step 0  Classify each income item into 40(1)..40(8), mark exempt parts, mark items the
        taxpayer elects to tax separately/finally (they leave the main return).
Step 1  Apply the 190,000 exemption (65+ or disabled <65, residents) to gross income of any
        category(ies) chosen by the user (sheet "ใบแสดงสิทธิการได้รับยกเว้นเงินได้").
        The remainder ("เงินได้หลังหักยกเว้น") is what goes on the form.
Step 2  Per category, deduct expenses (section 3) -> "income after expenses".
        Sum all categories = Line 11.1.
Step 3  Line 11.2: allowances and exemptions-after-expenses (section 5), each capped,
        then group caps (section 6). Total cannot exceed Line 11.1 (clamp result at 0).
Step 4  Line 11.3 = 11.1 - 11.2.
Step 5  Line 11.4: "2x" donations = min(2 x amount, 10% of Line 11.3).
Step 6  Line 11.5 = 11.3 - 11.4.
Step 7  Line 11.6: ordinary donations = min(amount, 10% of Line 11.5).
Step 8  Line 11.7 net income (เงินได้สุทธิ) = 11.5 - 11.6.
Step 9  Line 11.8 = progressive tax on 11.7 (section 2.1).
Step 10 Line 11.9 = alternative minimum tax (section 2.2).
Step 11 Line 11.10 = tax payable = max(11.8, 11.9) unless 11.9 <= 5,000, then 11.8.
Step 12 Line 11.11 + SEZ 0.1% tax (only special-development-zone filers), 11.12 total.
Step 13 Line 11.13 less foreign tax credit (not more than Thai tax on that income).
Step 15 Line 11.15 less: withholding tax (50 ทวิ), dividend tax credit, tax paid on
        ภ.ง.ด.93, tax paid on ภ.ง.ด.94.
Step 16+ Add separately computed taxes: gift 5% (ข้อ 9), severance attachment
        (ใบแนบ, net of its own WHT), and real-estate separate computation (ข้อ 8).
        For an amended return subtract tax per the previous return; add surcharge.
Result  Positive = tax to pay; negative = refund (ชำระไว้เกิน).
```

PND 91 (salary-only) is the same pipeline with only 40(1) income, no minimum tax, no 40(2)..(8) items.

---

## 2. Rates

### 2.1 Progressive rates (both 2568 and 2569) `[P]`

Table 1 of the 2568 PND 90 and 2569 PND 94 instructions.

| Net income from | to | Rate | Bracket width | Cumulative tax at top of bracket |
|---|---|---|---|---|
| 0 | 150,000 | exempt (0%) | 150,000 | 0 |
| 150,000.01 | 300,000 | 5% | 150,000 | 7,500 |
| 300,000.01 | 500,000 | 10% | 200,000 | 27,500 |
| 500,000.01 | 750,000 | 15% | 250,000 | 65,000 |
| 750,000.01 | 1,000,000 | 20% | 250,000 | 115,000 |
| 1,000,000.01 | 2,000,000 | 25% | 1,000,000 | 365,000 |
| 2,000,000.01 | 5,000,000 | 30% | 3,000,000 | 1,265,000 |
| over 5,000,000 | | 35% | | |

**Statutory schedule without the 150,000 exemption** (needed for severance and real-estate separate computations): the 0% first bracket is a Royal Decree exemption (พ.ร.ฎ. ฉบับที่ 470 พ.ศ. 2551) that only applies to net income under section 48(1). Separate computations say explicitly "ไม่ได้รับยกเว้น 150,000 บาทแรก" `[P]` (severance attachment and PND 90 instruction ข้อ 8). Implement this as: 0 to 300,000 at 5%, then the same brackets above. Equivalent: `taxNoExemption(x) = taxProgressive(x) + 0.05 * min(x, 150000)`.

### 2.2 Alternative minimum tax (ภาษีคำนวณจากเงินได้พึงประเมิน) `[P]`

From PND 90 instructions and form line 11.9:

- Base = sum of **gross** assessable income (before expenses) reported in PND 90 ข้อ 1 to ข้อ 7, items 1 to 4 of each, **excluding 40(1)**. So it includes 40(2), 40(3), 40(4) items 1 to 4, 40(5), 40(6), 40(7), 40(8) (including inherited real estate and gifts only if the taxpayer elected to combine them).
- Excluded from the base: 40(1); the dividend tax credit gross-up (ข้อ 3 item 5); income taxed finally/separately and not combined (10% dividends, 15% interest, severance attachment, real estate ข้อ 8, gifts ข้อ 9); exempt income; SEZ 0.1% income.
- Rule: if base >= 120,000, `alt = base * 0.005`. If `alt <= 5,000`, pay the progressive tax. If `alt > 5,000`, pay `max(progressive, alt)`.
- Practical effect: only bites when non-40(1) gross income exceeds 1,000,000 (0.5% x 1,000,000 = 5,000) and progressive tax is lower.
- PND 94 (half year) applies the same rule on all its 40(5)..(8) income `[P]` (Ins94_160669 p.15).
- Joint filing: apply to the combined return `[UNCONFIRMED]` (reasonable reading; RD text does not say per spouse).

---

## 3. Assessable income categories, form lines and expense deductions

### 3.1 Summary table `[P]` (PND 90 instructions 2568 ข้อ 1 to 7; PND 94 2569 instructions)

| Section | What it covers | PND 90 line | Expense deduction |
|---|---|---|---|
| 40(1) | Employment: salary, wages, per diem, bonus, pension (เบี้ยหวัด บำเหน็จ บำนาญ), housing allowance, value of free housing, debts paid by employer, any benefit from employment, one-time leaving payments when not taxed separately | ข้อ 1 item 1 (PND 91 ข้อ ก) | 40(1)+40(2) combined: 50%, max **100,000** per person |
| 40(2) | Income from a duty/position or from performing work: fees, commissions, discounts, meeting allowances, bonuses, rent-free housing given by the payer, whether regular or temporary. Most freelance service income is 40(2) | ข้อ 1 item 3 | Included in the same 50% / 100,000 cap as 40(1) |
| 40(3) | Goodwill, copyright, other rights; annuities from a will, other juristic act or court judgment | ข้อ 2 | Goodwill/copyright/other rights: 50% max 100,000 (combined across these items) **or** actual. Annuities (เงินรายปี): **no** deduction |
| 40(4) | Interest, dividends, mutual fund distributions, gains on securities/units, crypto/digital tokens, etc. (3.3) | ข้อ 3 | **None** |
| 40(5) | Rental of property; benefits from breach of hire-purchase / installment sale where seller keeps the money | ข้อ 4 | See 3.4 |
| 40(6) | Liberal professions: law, medicine (การประกอบโรคศิลปะ), engineering, architecture, accounting, fine arts (ประณีตศิลปกรรม) | ข้อ 5 | Medicine and fine arts 60%; law, engineering, architecture, accounting 30%; or actual |
| 40(7) | Contracting where the contractor supplies the essential materials (beyond tools) | ข้อ 6 | 60% or actual |
| 40(8) | Business, commerce, agriculture, industry, transport and everything not in (1) to (7), incl. sale of real estate bought for profit, sale of inherited/gifted/non-trade real estate if combined, gifts above exemptions if combined, mutual fund profit shares under the Revolutionary Council announcement when 10% WHT not accepted | ข้อ 7 | See 3.5 |

Detail rules:

- **40(1)+(2) base** `[P]` (form ข้อ 1): line 1 = all 40(1) including exempt severance; line 2 subtracts (1) PVD contributions above 10,000 (exempt part), (2) GPF contributions, (3) private-teacher-fund contributions, (4) exempt statutory severance; line 3 adds 40(2); line 5 expense = 50% of line 4, max 100,000. So exempt items reduce the 50% base before the cap.
- Spouses with income throughout the year each get their own 100,000 cap `[P]`. In a joint return where the spouse has both 40(1) and 40(2), the spouse's 40(2) expense portion is averaged and added to the filer's expense `[P]` (instruction ข้อ 1, wording "ให้เฉลี่ยค่าใช้จ่ายส่วนที่เป็นของเงินได้ตามมาตรา 40 (2)").
- **Fine arts 60%** is new from tax year 2568: Royal Decree No. 803 (2569, published 10 Feb 2569, amendment of Royal Decree No. 11) raised fine arts from 30% to 60%; the 2568 PND 90 form already shows 60% `[P]` (form ข้อ 5 item 2). Earlier years (2567 and before) were 30%.
- Income received in kind and tax paid on the taxpayer's behalf by anyone ("ภาษีอากรที่ผู้อื่นออกแทนให้ ไม่ว่าในทอดใด") are part of assessable income `[P]` (instruction "การกรอกรายการเงินได้พึงประเมิน"). Value in kind at market value `[S]`.

### 3.2 40(2) vs 40(8): common trap

Pure service work without supplying materials ("รับทำงานให้") is 40(2) and shares the 100,000 cap with salary. Selling goods or running a business is 40(8). Contracting with materials is 40(7). The payer's 50 ทวิ category is a hint, not determinative. Surface this choice in the UI with examples; do not let users pick 40(8) 60% for plain freelance services without a warning `[S]`.

### 3.3 40(4) items (form ข้อ 3) `[P]`

| Item | Content | Can be kept off the return (final WHT)? |
|---|---|---|
| 1 | Interest on bonds, deposits, debentures, bills, loans; discount on bills/debt instruments; similar returns on any debt claim | Yes, if 15% WHT was withheld and the taxpayer elects final (form says "เฉพาะที่ไม่เลือกเสียภาษีในอัตราร้อยละ 15"). Interest from a private individual (no WHT) must be reported |
| 1 (b) | Dividend-equivalent from foreign-security DRs | Yes, 10% final option |
| 2 | Profit share from mutual funds under the Securities Act 2535 | Yes, 10% final option |
| 3 | Dividends/profit shares from foreign companies | **No.** Always reported if taxable (foreign income rules, section 7.7) |
| 4 | Dividends/profit shares from Thai companies/juristic partnerships | Yes, 10% final option |
| 5 | Dividend tax credit (gross-up), only for 4 | Only if 4 is included |
| 6(1) | Profit share from holding digital tokens (40(4)(ช)) | No (report) |
| 6(2) | Gains on transfer of cryptocurrency / digital tokens above cost (40(4)(ฌ)) | Report unless exempt (section 4.4) |
| 6(3) to (6) | Gains above cost on redemption of RMF, LTF, SSF/SSFX, Thai ESG/ESGX: each split into exempt / not exempt | Exempt part not taxed |
| 6 others | Bonus to shareholders, capital reduction up to profits, capital increase from profits, gains on merger/dissolution, gains on transfer of partnership interests, units, shares, debentures, bonds, bills above cost | Report |

**All-or-nothing election** `[P]`: if the taxpayer includes item 1 (interest), every interest item must be included. If the taxpayer includes 2 **and** 4 (Thai fund distributions and Thai dividends), every item of both must be included; cannot cherry-pick payers.

**Dividend tax credit** `[P]` (instruction ข้อ 3 item 5, table 3):
- Only for residents (180+ days) or persons domiciled in Thailand.
- Credit = dividend x t / (100 - t), where t = corporate tax rate the paying company paid on the distributed profit. Credit is added to income (gross-up) and then deducted from tax at line 11.15. Excess becomes a refund.

| Corporate rate t | Credit fraction of dividend |
|---|---|
| 3% | 3/97 |
| 10% | 1/9 |
| 15% | 3/17 |
| 20% (current standard) | 1/4 |
| 23% | 23/77 |
| 25% | 1/3 |
| 30% | 3/7 |

- No credit for: dividends from mutual funds, foreign company dividends, dividends paid out of CIT-exempt profits (e.g. BOI) `[S]`. The 50 ทวิ / dividend slip states the rate; the UI should ask for the rate per dividend.
- Decision helper: including dividends is beneficial when the marginal rate is below t; with t = 20% the break-even is the 20% bracket, adjusting for the extra income pushing brackets. Compute both ways and recommend the lower (the election is per type as above).

### 3.4 40(5) rental `[P]`

| Asset | Flat rate |
|---|---|
| House, building, other structure, raft (บ้าน โรงเรือน สิ่งปลูกสร้างอย่างอื่น แพ) | 30% |
| Agricultural land | 20% |
| Non-agricultural land | 15% |
| Vehicles | 30% |
| Other property | 10% |
| Breach of hire-purchase / installment sale (seller keeps money) | 20% flat only (no actual option) |

Or actual expenses (necessary and reasonable). Sub-lease: deduct only the rent paid to the head lessor. Car rented with a driver is a service (40(8) / 3% WHT), not 40(5) `[S]`.

### 3.5 40(8) standard deduction table (Royal Decree No. 11 as amended, current text in PND 90 2568 table 2) `[P]`

All of the following 43 categories are **60%** of gross, except (1). Category (44) has no flat rate.

| # | Business type (Thai summary) | Rate |
|---|---|---|
| 1 | Performers: actors in plays/film/radio/TV, singers, musicians, professional athletes, entertainers | 60% of first 300,000 + 40% of the part over 300,000; total expense max **600,000** |
| 2 | Sale of land by installments or hire-purchase of land | 60 |
| 3 | Collecting fees from gambling, competitions or games (ค่าต๋ง) | 60 |
| 4 | Photography, developing, printing, enlarging photos/film, incl. selling parts | 60 |
| 5 | Dock, shipyard, boat repair (not machinery repair) | 60 |
| 6 | Shoes and genuine/artificial leather goods, incl. parts | 60 |
| 7 | Tailoring, sewing, knitting, embroidery, incl. parts | 60 |
| 8 | Making, decorating, repairing furniture, incl. parts | 60 |
| 9 | Hotel or restaurant, preparing food or drinks for sale | 60 |
| 10 | Hairdressing, beauty, body decoration | 60 |
| 11 | Soap, shampoo, cosmetics | 60 |
| 12 | Writing literary works (การทำวรรณกรรม) | 60 |
| 13 | Trading silverware, gold, nak, diamonds, gems, jewelry, incl. parts | 60 |
| 14 | Hospital with overnight beds incl. treatment and selling medicine | 60 |
| 15 | Stone crushing | 60 |
| 16 | Forestry, rubber plantation, perennial trees | 60 |
| 17 | Transport or hire by vehicle | 60 |
| 18 | Making blocks and stamps, printing, bookbinding, incl. parts | 60 |
| 19 | Mining | 60 |
| 20 | Beverage production under excise law | 60 |
| 21 | Tiles, ceramics, cement goods, earthenware | 60 |
| 22 | Generating or selling electricity | 60 |
| 23 | Ice making | 60 |
| 24 | Glue, paste and similar, and starch/flour (not cosmetics) | 60 |
| 25 | Balloons, glassware, plastics, finished rubber goods | 60 |
| 26 | Laundry or dyeing | 60 |
| 27 | Selling goods not covered elsewhere where the seller is not the producer | 60 |
| 28 | Prizes to horse owners from racing | 60 |
| 29 | Redemption of property sold with right of redemption, or acquiring absolute ownership from ขายฝาก | 60 |
| 30 | Smoking rubber, rubber sheets, other non-finished rubber | 60 |
| 31 | Tanning | 60 |
| 32 | Sugar or molasses | 60 |
| 33 | Fishing (จับสัตว์น้ำ) | 60 |
| 34 | Sawmill | 60 |
| 35 | Oil distilling or pressing | 60 |
| 36 | Hire-purchase of movables not within 40(5) | 60 |
| 37 | Rice mill | 60 |
| 38 | Agriculture of annual plants and grains | 60 |
| 39 | Curing tobacco leaves | 60 |
| 40 | Raising animals of all kinds, incl. by-products | 60 |
| 41 | Slaughtering for sale, incl. by-products | 60 |
| 42 | Salt farming | 60 |
| 43 | Selling ships 6+ tons, steamships or motorboats 5+ tons, or rafts | 60 |
| 44 | Any income not in (1) to (43) | **Actual expenses only** |

Notes:
- Older guides list 65%, 70%, 80%, 85% rates per category. Those were replaced by Royal Decree No. 629 (2560). Do not use them.
- Within 40(8) the user may hold several businesses; each line on the form gets its own method (flat or actual) `[P]` (form ข้อ 7 has per-row "ร้อยละ / จริง"). Do not mix methods within one item.
- Selling real estate acquired for trade/profit is 40(8) "others" (actual) `[P]`.
- Real estate inherited/gifted/non-trade: separate table, section 4.5.
- Actual-expense method: expenses must be necessary and reasonable, for the business, with evidence (receipts, tax invoices, records); personal and capital expenditures are not deductible `[S]`. Show an evidence warning whenever "actual" is chosen.
- SEZ (เขตพัฒนาพิเศษเฉพาะกิจ: Yala, Pattani, Narathiwat and listed Songkhla districts) 40(7)/(8) income from producing/selling goods/services inside the zone, 2567 to 2569: may elect **0.1% of gross** instead of the two-method calculation `[P]`. Also CCTV cost 100% exemption for 40(5)..(8) businesses in the zone, 2567 to 2569, actual-expense filers only `[P]` (พ.ร.ฎ. 785, DG 450).
- Energy-saving equipment with a 5-star label bought by 40(5)..(8) earners: extra 50% (1.5x total) of the cost, 3 Mar 2569 to 31 Dec 2571, e-Tax Invoice from VAT registrant, not combinable with the solar deduction `[P]` (PND 94 2569 instruction item 21; พ.ร.ฎ. 805; DG 471).

---

## 4. Special income

### 4.1 Severance and one-time leaving payments (เงินได้ที่นายจ้างจ่ายให้ครั้งเดียวเพราะเหตุออกจากงาน)

**Exemption** `[P]` (instruction ข้อ 1, exempt item (4); severance attachment note *):
- Statutory severance (ค่าชดเชย) under the Labour Protection Act or State Enterprise Labour Relations Act, **only for involuntary termination** (not retirement, not end of fixed-term contract): exempt up to the wages of the **last 400 days**, max **600,000**. (Older guides say 300 days / 300,000; that is outdated. Ministerial Regulation No. 394 (2567) amended this.)
- Applies for both under-5-year and 5+-year service.

**Tax treatment of the rest:**
- Service < 5 years: included with 40(1) in the normal return (50%/100,000 expense) `[P]`.
- Service >= 5 full years: may elect separate taxation under section 48(5) on the attachment "ใบแนบ ภ.ง.ด.90/91 กรณีคำนวณเงินได้ที่นายจ้างจ่ายให้ครั้งเดียวฯ" `[P]`. Conditions (DG notification No. 45): 5+ years of work; only payments made in the first tax year of leaving; none of it combined in the normal return `[P]` (RD severance manual).

Separate computation `[P]` (attachment `9091out_241268.pdf`, RD manual `leave_of_work.pdf`):

```
Income types:
  A = gratuity computed like civil-service gratuity (บำเหน็จ)
  B = payments from PVD / GPF / RMF-for-PVD that are taxable (employer part + earnings)
  C = statutory severance after the exempt part
  D = other one-time leaving payments computed differently (e.g. ex gratia lump sum)
years = years of work; remainder >= 183 days counts as 1 year, else drop.
cap   = min(lastFullMonthSalary, avgLast12MonthsSalary * 1.10) * years
base  = (A + B + C) + min(D, cap)            // full A+B+C, D limited by cap
exp1  = 7,000 * years, but not more than base      // 3,500 * years if paid partly as
                                                    //  gratuity + partly as pension (s.48(5))
exp2  = 50% * (base - exp1)
gross = A + B + C + D  (less 190,000 if the 65+/disabled exemption is used here)
net   = gross - (exp1 + exp2)
tax   = taxNoExemption(net)     // no 0% first 150,000 bracket
due   = tax - WHT on these payments  -> added to (or refunded via) PND 90 line 11.20/11.21
```

### 4.2 Provident fund (PVD), RMF, SSF, Thai ESG, LTF withdrawals

| Product | Exempt when | Otherwise |
|---|---|---|
| PVD | Leaving at age 55+ with 5+ years of fund membership; death; disability; transfer to another PVD or to RMF-for-PVD (then RMF rules) `[S]` | Employee's own contributions never taxed. Employer contributions + earnings on both are taxable 40(1) one-time leaving income; separate computation 4.1 allowed if 5+ years of work `[S]` (SET, KAsset) |
| RMF | Held 5+ years from first purchase **and** redeemed at age 55+, or disability/death `[P]` | Gains above cost taxable (form ข้อ 3 6(3) "ไม่ยกเว้น"); plus previously deducted amounts for up to the last 5 years must be added back via amended returns with 1.5%/month surcharge `[P]` |
| SSF (bought 2563 to 2567) | Held 10 years day-to-day `[S]` | Gains taxable; claw-back of deductions |
| Thai ESG | Held 5 years day-to-day for purchases 1 Jan 2567 to 31 Dec 2569; 8 years for purchases 21 Nov to 31 Dec 2566 and from 1 Jan 2570 `[P]` | Claw-back for up to 5 years with surcharge; gain computed FIFO `[P]` |
| Thai ESGX | Held 5 years from purchase (new money) or from the LTF-switch notification date `[P]` | Same claw-back, FIFO |
| LTF | Held 7 calendar years (legacy) `[S]` | |

### 4.3 Retirement annuity / pension

Pensions (บำนาญ) are 40(1). Annuity-insurance payouts: out of scope of calculator inputs; treat as reported by the insurer `[UNCONFIRMED]`.

### 4.4 Crypto and digital tokens

- 40(4)(ฌ): gain on transfer of cryptocurrency or digital tokens, only the part above cost `[P]` (form ข้อ 3 6(2)). 40(4)(ช): profit shares from holding digital tokens `[P]`.
- **Exemption 2568 to 2572** `[P]` (Ministerial Regulation No. 399 (2568), published 5 Sep 2568, adds item (109) to MR 126 clause 2, retroactive from 1 Jan 2568 to 31 Dec 2572): individuals' gains from transferring crypto/digital tokens **through an SEC-licensed Thai digital asset exchange, broker, or by transfer to a licensed dealer** are exempt.
- Gains through foreign exchanges, DeFi, P2P or unlicensed platforms remain taxable `[S]` (implied by the licensing condition).
- Loss offset: RD crypto manual (Jan 2565, revised edition 2) allows losses on crypto transferred through **licensed** exchanges to offset gains through licensed exchanges **in the same tax year only**; no carry-forward `[S]`. Since licensed-exchange gains are exempt for 2568 to 2572, in practice: report net gains from non-licensed platforms with **no** loss offset `[UNCONFIRMED]` (legal instrument number not verified; treat as conservative default with a review flag).
- Cost basis: RD manual permits FIFO or moving average, applied consistently `[S]`.
- 15% WHT under section 50(2) on (ซ)/(ฌ) is waived for licensed-exchange transactions `[S]`.
- Whether gains on a foreign exchange are foreign-source (remittance rule, 7.7) is not settled by RD guidance found `[UNCONFIRMED]`.

### 4.5 Sale of immovable property that is not a trade (inherited, gifted, or not acquired for profit)

`[P]` (PND 90 instruction ข้อ 7 item 3 and ข้อ 8):

- The land office withholds tax at transfer (WHT computed on the official appraised value). The seller may treat that as final and leave the sale off the return. If final, nothing goes on PND 90.
- Otherwise, two options:
  1. Combine with other income in ข้อ 7 item 3. Expenses: inherited or gifted = **50% flat only**; acquired otherwise (non-trade) = actual, or flat by years held:

     | Years held | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8+ |
     |---|---|---|---|---|---|---|---|---|
     | Flat % of income | 92 | 84 | 77 | 71 | 65 | 60 | 55 | 50 |

     Years held = calendar years from the year of acquiring ownership/possession to the year of transfer; part of a year counts as 1; cap 10 years.
  2. Separate calculation (ข้อ 8) when claiming actual expenses but not combining: `net = income - actual expenses`; `tax = taxNoExemption(net / years) * years`; tax must not exceed **20% of the sale price**. Result goes to line 11.17.
- Specific business tax 3.3% (sale within 5 years, unless lived in it 1+ year) and stamp duty 0.5% are not PIT; mention in UI only.

### 4.6 Gifts and support (ข้อ 7 item 4 / ข้อ 9) `[P]`

| Exempt part per tax year | Excess |
|---|---|
| Real estate transferred without consideration to a legitimate child (not adopted): 20,000,000 per child (s.42(26)) | Elect 5% final on the excess (ข้อ 9) or combine as 40(8) |
| Support or gifts from ascendants, descendants, spouse: 20,000,000 (s.42(27)) | Same |
| Gifts from others by moral duty or on ceremonies/customary occasions: 10,000,000 (s.42(28)), excluding MR 325 cases | Same |

Inheritance itself is not PIT; Inheritance Tax Act 2558 taxes inheritances above 100,000,000 (5% for ascendants/descendants, 10% others) `[S]`. Out of scope for the engine.

### 4.7 Foreign-sourced income `[P]` for forms, `[S]` for orders

- Resident = in Thailand 180+ days (one or several periods) in the calendar year `[P]`.
- Departmental Order ป.161/2566 (15 Sep 2566): foreign-sourced income of a resident is taxable in the year it is **brought into Thailand**, regardless of the year earned, for remittances from 1 Jan 2567. ป.162/2566 (20 Nov 2566): income earned **before** 1 Jan 2567 is not taxable when remitted `[S]`.
- RD reads residence in the tax year the income arose (RD Q&A on section 41) `[S]` per ThaiLawOnline.
- Report on "ใบแสดงเงินได้กรณีมีเงินได้จากต่างประเทศนำเข้ามาในประเทศไทย" by category, country and year earned `[P]`.
- Foreign tax credit (line 11.13): limited to the Thai tax on that income; available under a double tax agreement `[P]` for the line, `[S]` for DTA requirement. Pro-rata method per RD tool `[UNCONFIRMED]`.
- **Proposed** exemption for income remitted in the year earned or the following year: announced by RD in mid-2568, **not law** as of 19 Oct 2026 (no Royal Gazette publication) `[PENDING]`.
- LTR visa holders (wealthy global citizen, wealthy pensioner, work-from-Thailand professional) have a foreign-income exemption by Royal Decree No. 743 (2565); highly-skilled professionals may elect 17% on Thai employment income `[S]`. DTV gives no exemption `[S]`. Treat as out-of-scope flags in the UI.

### 4.8 Age 65+ and disabled persons `[P]`

- Resident aged **65+ at any time in the tax year**: 190,000 of assessable income exempt, taken from any category or categories the taxpayer chooses, total max 190,000 per person. Each spouse with income gets their own 190,000.
- Resident disabled person with a disability card (or foreigner with a disability certificate) aged under 65: 190,000 on the same terms. In the year someone turns 65 and uses the age exemption, they cannot also use the disability one.
- Applied before expenses (step 1). Can also be used on the severance attachment and on PND 94.

### 4.9 Lottery and prizes

- Government lottery (สลากกินแบ่งรัฐบาล): exempt under s.42(11); Lottery Office deducts 0.5% stamp duty (1 baht per 200) `[S]` (ThaiPublica citing RD).
- Charity lottery, GSB/BAAC lottery savings prizes: 1% WHT at payment; final option `[S]`.
- Other prizes from contests/lucky draws: 5% WHT; the prize is 40(8) (category 44, actual) `[S]`.

### 4.10 Interest exemptions

- Savings-account interest totalling **<= 20,000 per year across all banks**: exempt, provided the depositor has consented to banks reporting data to RD; otherwise 15% is withheld on all savings interest `[S]` (RD ruling page 26901, Krungsri notice).
- Tax-free 24+ month fixed-deposit accounts (monthly deposits, total <= 600,000) `[UNCONFIRMED]` (general knowledge, MR 126 clause 2(74)).

### 4.11 Other common exempt items `[S]` unless noted

Travel/per diem paid for the employer's business at actual cost (s.42(1)); scholarships; inheritance (s.42(9)); sale of movable property not for trade (s.42(9)); gains on SET-listed shares sold on SET (MR 126 clause 2(23)); compensation/insurance payouts for damage; certain government payments. Keep a configurable exempt-item list rather than hardcoding.

---

## 5. Allowances and exemptions after expenses (ค่าลดหย่อน)

`2568` and `2569` columns give the value for each tax year. Legal basis in brackets. Source for 2568 = PND 90/91 instructions 2568 and deductions attachment; for 2569 = PND 94 2569 instructions plus later laws listed.

### 5.1 Personal and family

| ID | Item | 2568 | 2569 | Conditions |
|---|---|---|---|---|
| personal | Taxpayer | 60,000 `[P]` | 60,000 `[P]` | Non-juristic partnership/body of persons: 60,000 if one partner resident, 120,000 if 2+ |
| spouse | Spouse | 60,000 `[P]` | 60,000 `[P]` | Legally registered spouse **with no income**, or spouse whose income is combined in a joint return. If both have income and file separately, no spouse allowance. Non-resident filer: only spouse living in Thailand. Marriage during the year: allowance allowed `[UNCONFIRMED]` (form has "สมรสระหว่างปีภาษี" status; full-year rule only written for spouse's insurance/PVD/SS) |
| child | Each child | 30,000 `[P]` | 30,000 `[P]` | Legitimate child of taxpayer or of spouse; adopted child 30,000 each |
| child2plus | Legitimate child from the 2nd onward born in or after 2561 | +30,000 (= 60,000) `[P]` | +30,000 (= 60,000) `[P]` | Birth order counts **all** legitimate children whether alive or not |
| | Child conditions | | | Under 20 (minor), or under 25 and studying at university/higher education, or court-declared incompetent/quasi-incompetent; child's non-exempt assessable income in the year must be **< 30,000**; allowed for the full year even if the condition existed for part of it. Adopted: max 3 total; legitimate children counted first; if 3+ living legitimate children, no adopted ones; a child can only be claimed in one status. Non-resident filer: only children living in Thailand. Both spouses with income, filing separately: **each** may claim each child in full `[P]` (RD Clear Cut, rd.go.th/62777) |
| prenatal | Prenatal care and childbirth | actual, max 60,000 per pregnancy `[P]` | same `[P]` | Paid by taxpayer or spouse; if spread over 2 tax years, total per pregnancy still 60,000; twins = one pregnancy; a miscarriage and a new pregnancy in the same year = two. Both spouses with income filing separately: the wife claims (DG 331) `[S]` |
| parent | Each parent supported | 30,000 `[P]` | 30,000 `[P]` | Parent 60+; parent's assessable income in the year not over 30,000; taxpayer or spouse must be a **legitimate** child (adopted children cannot claim); taxpayer's own parents, plus spouse's parents if spouse has no income (or joint). Max 4 parents = 120,000. Several siblings: only the one holding ล.ย.03 claims each parent. Non-resident filer: only parents in Thailand. Parent ID numbers required |
| disabled | Each disabled/incapacitated dependent | 60,000 `[P]` | 60,000 `[P]` | Parents, spouse's parents, spouse, legitimate/adopted children, spouse's legitimate children, plus **one** other person for whom the taxpayer is the registered caregiver; must hold a disability card (taxpayer named as caregiver) or be incapacitated 180+ days per a doctor's certificate issued in that tax year; dependent's non-exempt income <= 30,000; Thai ID number required; forms ล.ย.04 / ล.ย.04-1. If the person is both disabled and incapacitated, claim once. Can be claimed in addition to the parent/child allowance for the same person `[S]` |
| parentHealth | Health insurance premiums for parents | actual, max **15,000 total** (all parents combined, not per parent) `[P]` | same `[P]` | Parents' income <= 30,000 (no age condition); legitimate child only; own parents plus spouse's parents if spouse has no income; split pro-rata if several children pay one policy; Thai insurer; non-resident: parents in Thailand |

### 5.2 Insurance, savings and investment

| ID | Item | 2568 | 2569 | Conditions |
|---|---|---|---|---|
| lifeIns | Life insurance premiums (own) | actual, max 100,000 `[P]` | same `[P]` | Policy term 10+ years, Thai life insurer; premiums for riders excluded; cash-back during term within 20% rules (policies from 2552); policies from 2563 require notifying the insurer of the intention to claim. Includes GSB life/family savings and "special bank" life deposits of 10+ years (within the same 100,000). Spouse without income, marriage all year: + spouse's life premiums max **10,000** |
| healthIns | Health insurance premiums (own) | actual, max 25,000 `[P]` | same `[P]` | Life + own health combined max **100,000** |
| annuity | Annuity (pension) life insurance | 15% of taxable assessable income, max 200,000 `[P]` | same `[P]` | 10+ year policy; payouts from age 55 to 85+; premiums fully paid before payouts; first payout may be a lump sum up to 30% of sum insured (DG 462, from 1 Jan 2568). **Must first fill any unused room in the 100,000 life bucket** (see 6.2). Counts in the 500,000 retirement cap |
| pvd | Provident fund employee contributions | actual, total max 500,000: first 10,000 as allowance + the rest (max 490,000) as exempt income, the exempt part max 15% of wages `[P]` | same `[P]` | Spouse's PVD contributions (no-income spouse, marriage all year) deductible under the same rule. Counts in 500,000 cap |
| gpf | Government Pension Fund (กบข.) contributions | actual, max 500,000 (exempt in ข้อ 1 line 2) `[P]` | same `[P]` | Counts in 500,000 cap |
| teacherFund | Private school teachers' fund | actual, max 500,000 `[P]` | same `[P]` | Counts in 500,000 cap |
| nsf | National Savings Fund (กอช.) | actual, legal max 500,000 `[P]`; NSF membership caps contributions at 30,000 per year `[S]` | same | Counts in 500,000 cap |
| rmf | RMF | 30% of taxable assessable income, max 500,000 `[P]` | same `[P]` | Buy at least once a year, no gap over 1 consecutive year; hold 5+ years from first purchase and redeem at 55+; purchases from 2565 require notifying the AMC; units transferred from PVD are not deductible. Counts in 500,000 cap |
| ssf | SSF | **0** (deduction ended for purchases after 31 Dec 2567) `[P]` (not on the 2568 attachment) `[S]` | **0** | Existing holdings: 10-year hold |
| thaiEsg | Thai ESG | 30% of taxable assessable income, max **300,000** `[P]` | 30%, max **300,000** `[P]` | Separate from the 500,000 cap; hold 5 years day-to-day (purchases 2567 to 2569); individuals only (not partnerships/estates); notify AMC. **From 2570 to 2575: 100,000 and 8-year hold** `[P]` (MR 390 as amended by MR 395). In 2569, purchases of Thai ESGX funds count under this same 300,000 cap `[S]` (KAsset; Finnomena) |
| esgxNew | Thai ESGX new money | 30% of **assessable income**, max 300,000, separate from Thai ESG and the 500,000 cap `[P]` | **0** as a separate pool (new ESGX money shares the Thai ESG cap) `[S]` | 2568: only purchases within 2 months of first offering, not after 30 Jun 2568 (window was May to June 2568); hold 5 years (MR 398, DG 458) |
| esgxLtf | Thai ESGX from LTF switch | min(switched value, 300,000) `[P]` | (min(switched value, 500,000) - 300,000) / 4 per year, i.e. max **50,000** per year for 2569, 2570, 2571, 2572 `[P]` | Must have switched **all** LTF units held on 11 Mar 2568 (all funds, all AMCs) by 30 Jun 2568; value at notification-date price; no 30% income test `[S]`; hold 5 years from notification; any LTF redemption/switch from 12 Mar 2568 voids the benefit |
| homeLoan | Home loan interest | actual, max 100,000 `[P]` | same `[P]` | Loan from Thai bank, finance/securities/credit foncier company, life insurer, cooperative, employer welfare fund, Secondary Mortgage Corp., certain funds, GPF; to buy/hire-purchase/build a residence (house, house+land, condo unit); mortgaged for the loan term; used as residence in the year (exceptions for employer transfers and disasters); several homes allowed within the 100,000 total; co-borrowers split equally within 100,000; spouses both with income and joint borrowers: half each; refinance allowed; lender's certificate required |
| socialSecurity | Social security contributions | actual; section 33 max **9,000** (750 x 12; wage ceiling 15,000) `[S]` | actual; section 33 max **10,500** (875 x 12; wage ceiling 17,500 from 1 Jan 2569 to 31 Dec 2571, phase 2 2572 to 2574 ceiling 20,000) `[S]` (Ministerial Regulation on contribution wage ceiling 2568, Cabinet 2 Dec 2568, Royal Gazette) | Section 39: 432 x 12 = **5,184** `[S]` (2569 unchanged `[UNCONFIRMED]`); section 40: actual per chosen option `[S]`. Spouse's contributions deductible if spouse has no income and marriage all year `[P]`. The 50 ทวิ shows the employee amount. Do not hardcode the max: cap = min(input, statutoryMax[year][section]) |
| politicalParty | Donation to political parties / fundraising support | actual, max 10,000 total `[P]` | same | Thai nationals only; receipt พ.ก.11 / พ.ก.9 |
| socialEnterprise | Investment in shares of a registered social enterprise (establishment or capital increase) | actual, max 100,000 `[P]` | same `[P]` | Must hold until the enterprise is dissolved (พ.ร.ฎ. 735, DG 38/47) |

Separately from the political-party donation, a Thai-national taxpayer with tax payable may allocate up to **500 baht** of tax to one political party on the return. It is not a deduction and does not change the tax due `[P]`.

### 5.3 Time-limited stimulus measures

| ID | Measure | 2568 | 2569 | Conditions and legal basis |
|---|---|---|---|---|
| easyEReceipt | Easy E-Receipt 2.0 | max 50,000: up to 30,000 for general goods/services from VAT registrants + up to 20,000 more for OTOP, registered community enterprises, registered social enterprises `[P]` | **None announced** as of 4 Nov 2026 `[S]` (caretaker-government period blocked it; no MR on RD new-law list through 29 Oct 2569) | Purchases 16 Jan to 28 Feb 2568 in Thailand; only e-Tax Invoice or e-Receipt; from non-VAT sellers only books/newspapers/magazines (incl. e-books), OTOP, community enterprises, social enterprises. Excluded: alcohol, tobacco, fuel/gas/EV charging, cars/motorcycles/boats, utilities, phone/internet, services usable beyond the period, non-life insurance, tour packages, hotels, homestays, non-hotel lodging. Individuals only. MR 397, DG 455 |
| travel | Domestic travel (เที่ยวดีมีคืน) | see below `[P]` | **None announced** `[S]` | Stays in hotels / certified homestays / registered non-hotel lodging and restaurant services, paid to VAT registrants, **29 Oct to 15 Dec 2568** (stay dates in the window); tax invoice must show the buyer's 13-digit ID, dates, province. MR 401, DG 463 |
| | Main cities | actual, max 10,000 with paper or e-Tax invoice, plus up to 10,000 more with **e-Tax Invoice only**: max deduction 20,000 `[P]` | | |
| | Secondary cities (55 provinces, list in 5.5) | 1.5 x actual: first 10,000 of spending (paper or e-Tax) and the next 10,000 (e-Tax only): max deduction 30,000 `[P]` (worded as 1.5x of amounts; ThaiPublica: max 30,000) | | The 20,000 spending ceiling is shared across main and secondary cities `[S]` (inference, see 5.5) |
| newHouse | Construction of a new residence | 10,000 per each 1,000,000 of construction cost paid, max 100,000, one house `[P]` | same rule still claimable `[P]` (listed in PND 94 2569) | Contract made and construction started **9 Apr 2567 to 31 Dec 2568**; contractor VAT-registered and not a real-estate developer subject to SBT; land and construction contracts separate; new build only (no extension/renovation); stamp duty paid electronically; full tax invoice, contract, building permit. **Claimed in the tax year construction is completed** (later of contract end date and permit/notification date), so contracts in the window finishing in 2569 are claimed for 2569. Co-contractors split equally; spouse rules as for home loans. MR 393, DG 445. Rounding of partial millions: treat as floor(cost / 1,000,000) x 10,000 `[UNCONFIRMED]` |
| art | Visual art purchase | actual, max 100,000 `[P]` | same `[P]` | Purchases 1 Jan 2568 to 31 Dec 2570 in Thailand from National Artists (visual arts), Silpathorn artists (visual arts), or artists registered with the Office of Contemporary Art and Culture (Thai nationals only), or from companies / public-charity foundations selling or auctioning their works; painting, sculpture, prints, photography, mixed media; full tax invoice (VAT seller) or receipt with buyer's name and tax ID and artist/title/type/year/size; not combinable with other measures. MR 400, DG 465 |
| solar | Solar rooftop | 0 | actual, max **200,000** (incl. VAT), one system, once per person `[P]` | Equipment + installation on a residential roof/rooftop, connected to MEA/PEA grid, paid to a VAT registrant with **e-Tax Invoice**; claimed in the tax year grid connection is completed; period **3 Mar 2569 to 31 Dec 2571**; cannot also use the energy-saving measure; system <= 10 kWp, on-grid or grid-tied hybrid, MEA/PEA approval in claimant's name, residential electricity user `[S]` (Arnajak, Tera Group); cannot combine with the 50,000 government subsidy `[S]`. พ.ร.ฎ. 805 (Royal Gazette 2 Mar 2569, vol. 143 ตอน 17 ก), DG 470 (2 Oct 2569) |
| floodRepair2569 | Flood damage repairs 2569 | n/a | **Pending**: home/condo repair actual max 100,000; car/motorcycle repair actual max 30,000 `[PENDING]` | Cabinet approved ~20 Oct 2569 for damage 15 May to 31 Dec 2569 in declared disaster areas. No Ministerial Regulation on RD's new-law list as of 29 Oct 2569. Model as a disabled feature flag. Precedent: MR 396 (2567), DG 452/453 |
| cctvSez | CCTV in SEZ | 100% of cost `[P]` | 100% of cost `[P]` | 40(5)..(8) earners with a place of business in the southern special development zone, paid 1 Jan 2567 to 31 Dec 2569, new equipment, must file using actual expenses |

### 5.4 Donations (computed last, after all allowances)

| ID | Type | 2568 | 2569 | Notes |
|---|---|---|---|---|
| donation2x | "2x" donations | 2 x amount, total of all 2x items max 10% of line 11.3 `[P]` | same `[P]` | See list below |
| donation1x | Ordinary donations | amount, max 10% of line 11.5 (after 2x deduction) `[P]` | same, but **only via e-Donation** for temples, foundations, associations and public charities from 1 Jan 2569 `[P]` (PND 94 2569 instruction; MoF notification on income tax and VAT No. 2 as amended) | Spouse with no income cannot deduct own donations; joint receipts without split = equal shares per named person |

2x list (all subject to the shared 10% cap):
- Education institutions (state, private schools excluding non-formal, private higher education, UN-treaty institutions, high-potential foreign institutions) and sports bodies (Sports Authority, provincial sports committees and associations, "of Thailand" associations, National Sports Development Fund, Department of Physical Education): **via e-Donation, 1 Jan 2568 to 31 Dec 2570** `[P]` (Royal Decrees No. 809 and 810, posted by RD 14 Oct 2569, retroactive). The previous measure ended 31 Dec 2567, so when people filed 2568 returns in early 2569 the RD system allowed only 1x. Those taxpayers may now file an amended return for the 2x. RD said the e-filing system would support this once the law took effect `[S]`.
- State hospitals (พ.ร.ฎ. 663, from 2561, no end date) `[P]`.
- Thai Red Cross and 26 listed medical foundations (Siriraj Foundation, Chulabhorn Foundation, Ramathibodi Foundation etc.), via e-Donation 1 Jan 2568 to 31 Dec 2570 (พ.ร.ฎ. 795, amended by 806 in 2569) `[P]`.
- Safe and Creative Media Fund, cultural, contemporary art, archives and archaeology funds (พ.ร.ฎ. 615); Justice Fund (651) `[P]`.
- Equitable Education Fund, via e-Donation 2567 to 2571 (782) `[P]`.
- Office of Knowledge Management and Development (OKMD), via e-Donation 2568 to 2569 (794) `[P]`.
- Metrology, health-system research, science and technology, science/research/innovation funds, via e-Donation 2566 to **2568 only** (770) `[P]`. Not available in 2569 unless renewed.

1x items deductible within the general 10% (beyond the usual temples, Red Cross, state hospitals/schools, listed charities): social enterprise promotion fund and community forest project (e-Donation, combined with 47(7)); stupa project at Phra Maha That Naphamethanidon / Naphaphonphumisiri (Air Force), 2568 to 2570 (พ.ร.ฎ. 804); disaster relief through juristic agents; school lunch fund; disabled-persons, social welfare, child protection, sports development funds; and others in the RD list `[P]`. Some "other" items are deductible at 100% or 2x within 10% of line 11.3 (books/e-media for reading at schools, accessibility for the disabled, teacher development fund, child development centres, juvenile training projects) `[P]`.

### 5.5 Secondary cities for the 2568 travel measure (55 provinces) `[S]` (Traveloka list matching Cabinet 21 Oct 2568)

North (16): Kamphaeng Phet, Chiang Rai, Phrae, Mae Hong Son, Tak, Nakhon Sawan, Lampang, Nan, Phetchabun, Lamphun, Sukhothai, Phayao, Phitsanulok, Uthai Thani, Uttaradit, Phichit.
Northeast (18): Kalasin, Loei, Chaiyaphum, Sisaket, Nakhon Phanom, Sakon Nakhon, Bueng Kan, Surin, Buriram, Nong Khai, Maha Sarakham, Nong Bua Lamphu, Mukdahan, Amnat Charoen, Yasothon, Udon Thani, Roi Et, Ubon Ratchathani.
Central (7): Chai Nat, Lopburi, Sing Buri, Ang Thong, Suphan Buri, Samut Songkhram, Ratchaburi.
East (5): Sa Kaeo, Chanthaburi, Prachin Buri, Trat, Nakhon Nayok.
South (9): Phatthalung, Ranong, Chumphon, Pattani, Trang, Satun, Yala, Nakhon Si Thammarat, Narathiwat.

Some districts in main provinces also counted as secondary; the district list was not found `[UNCONFIRMED]`. Suggested engine rule for mixed spending: tier 1 = first 10,000 of eligible spend (any invoice), tier 2 = next 10,000 (e-Tax only); deduction = sum(main spend x 1) + sum(secondary spend x 1.5); allocate the user's spend to tiers in the order that maximises the deduction (secondary first), cap total 30,000. The allocation order is not specified by RD `[UNCONFIRMED]`.

---

## 6. Group caps and interactions

### 6.1 "Assessable income subject to tax" base for 30% / 15% tests

For RMF, Thai ESG and annuity insurance, the base is gross assessable income subject to tax in the year (not net income), i.e. sum of all categories after exempt items. It **also includes income the taxpayer elected to tax finally or separately** (15% interest, 10% dividends, land-office real estate WHT), which is reported in PND 90 **ข้อ 10** for exactly this purpose `[P]`. ESGX new money (2568) uses "assessable income" `[P]`.

### 6.2 Life, health and annuity `[P]`

```
health      = min(healthPremium, 25,000)
lifeBucket  = min(lifePremium + health, 100,000)     // + spouse life max 10,000 separately
room        = 100,000 - lifeBucket
annuityInLife = min(annuityPremium, room)            // RD: use the 100,000 first
annuityRest = annuityPremium - annuityInLife
annuityDed  = min(annuityRest, 0.15 * base6_1, 200,000)  // then subject to 6.3
```

### 6.3 Retirement savings cap 500,000 `[P]`

```
retirementItems = pvdTotal (10,000 allowance + exempt part)
                + gpf + teacherFund + nsf + rmf + annuityDed
each item first capped individually, then
sum(retirementItems) <= 500,000
```
SSF is no longer part of it (no SSF deduction from 2568). Thai ESG, Thai ESGX (both pools) and life/health insurance are **outside** this cap.
Allocation when over the cap: RD gives no order; let the user choose or reduce RMF/annuity first (discretionary items) `[UNCONFIRMED]`.

### 6.4 Clamp

Allowances cannot create a negative line 11.3 (clamp at 0). Donations are capped by 10% of the post-allowance amounts as in section 1.

### 6.5 Combined savings headroom in 2569

500,000 (retirement) + 300,000 (Thai ESG incl. ESGX new) + up to 50,000 (ESGX LTF tranche) + 100,000 (life+health) + 15,000 (parents' health). The TISA reform (single 800,000 cap, multipliers) is **not law**; the Finance Ministry now targets tax year 2570 `[PENDING]` (Kaohoon Sep 2569; Nation Jul 2026).

---

## 7. Spouses and family

`[P]` unless noted (PND 90 2568 filing-status section; PND 91 2568; Revenue Code s.57 ter to 57 sexies).

- Married couples file separately by default; each reports own income and takes own personal allowance and own expense caps.
- Filing status options on PND 90 when the spouse has income:
  1. Spouse has 40(1) to (8): combine (รวมคำนวณ, attach "รายละเอียดแนบ ภ.ง.ด.90 กรณีรวมคำนวณภาษี"), file separately, or **separate only 40(1)** while 40(2) to (8) are combined into the filer's return.
  2. Spouse has only 40(2) to (8): combine or separate.
  3. Spouse has only 40(1) and files separately (spouse files PND 91).
  4. Spouse has no income.
- PND 91: both 40(1)-only spouses either file separate PND 91s or combine in one (each still gets 50% up to 100,000).
- Joint return: spouse allowance 60,000 applies; each spouse's expense caps are separate; the combined net income is taxed once on the progressive table (usually worse than separate filing). The engine should compute separate vs joint and recommend.
- Income splitting between spouses is not allowed except: jointly owned income (e.g. rental, 40(8) jointly run business) reported per the ownership share ("เป็นเงินได้ของผู้มีเงินได้ร้อยละ ... ของคู่สมรสร้อยละ ..." columns on the form) `[P]`.
- Items that need marriage throughout the year: spouse's life insurance 10,000, spouse's PVD, spouse's social security, separate expense caps for spouses `[P]`.
- Children with both spouses earning: each may claim each child (5.1). Parents of the spouse: only if spouse has no income or joint. Home loan: joint borrowers both earning: half each, combined max 100,000.
- Joint filing child allowance mechanics in the combined attachment `[UNCONFIRMED]`.

---

## 8. Forms, deadlines, payment, penalties, refunds

### 8.1 Forms `[P]`

| Form | Who | Period |
|---|---|---|
| ภ.ง.ด.91 | Only 40(1) income (any number of employers) | Annual |
| ภ.ง.ด.90 | Any 40(2) to 40(8) income (with or without 40(1)) | Annual |
| ภ.ง.ด.94 | 40(5) to 40(8) income received Jan to Jun | Half year, credited on the annual return |
| ภ.ง.ด.93 | Advance payment (rare) | Credit at line 11.15 |
| ภ.ง.ด.95 | Foreign employees of International Business Centers/ROH electing the special regime | Annual |

Attachments and evidence: 50 ทวิ (WHT certificate from each payer, s.50 bis); ใบแนบ deductions list (in the form); severance attachment; 65+/disability exemption sheet; foreign income sheet; joint-filing attachment; ล.ย.03 (parent support certificate), ล.ย.04 and ล.ย.04-1 (disabled/incapacitated dependents); lender interest certificate; construction documents; e-Tax Invoices. Insurance, PVD/RMF/Thai ESG purchases and e-Donations are now reported electronically by insurers/AMCs/recipients (AMCs by 15 Jan of the following year) once the taxpayer gives consent `[P]`. ล.ย.01 is the employee's allowance notice to the employer for monthly payroll withholding; it is **not** filed with the return.

### 8.2 Filing thresholds (file even if no tax is due) `[P]`

| Situation | Must file if assessable income exceeds |
|---|---|
| PND 91, single | 120,000 |
| PND 91, married (either or both combined) | 220,000 |
| PND 90, single | 60,000 |
| PND 90, married | 120,000 |
| PND 94, single / married | 60,000 / 120,000 (Jan to Jun income) |
| Undivided estate, non-juristic partnership / body of persons | 60,000 |

Also file whenever tax was withheld and a refund is wanted. "Exceeds" means strictly above.

### 8.3 Deadlines

| Item | Tax year 2568 | Tax year 2569 |
|---|---|---|
| PND 90/91 paper | 1 Jan to 31 Mar 2569 `[P]` | 1 Jan to 31 Mar 2570 (statutory) `[P]` |
| PND 90/91 e-filing | to **8 Apr 2569** `[S]` (PRD, Thai PBS) | 8 Apr 2570 **not yet confirmed**: the MoF 8-day e-filing extension covered deadlines from 1 Feb 2567 to 1 Jan 2570 (MoF notice 1 Mar 2567, Royal Gazette 18 Mar 2567) `[S]`; renewal not found as of 4 Nov 2026 `[UNCONFIRMED]` |
| PND 94 paper | 1 Jul to 30 Sep 2568 | 1 Jul to 30 Sep 2569 `[P]` |
| PND 94 e-filing | 8 Oct 2568 `[S]` | 8 Oct 2569 `[S]` |
| Disaster areas | | Filings/payments due 1 Sep to 29 Dec 2569 extended to 30 Dec 2569 in declared areas (MoF notice No. 18, 22 Oct 2569) `[P]` title, `[S]` details |

Deadlines falling on weekends/holidays move to the next business day for e-filing `[S]`. Paper by registered post (Bangkok domicile only) uses the postmark date `[P]`.

### 8.4 Installments `[P]`

- Tax payable >= 3,000: may pay in 3 equal installments, only if the return is filed on time.
- Paper PND 90/91: 31 Mar, 30 Apr, 31 May. E-filing: with filing (by 8 Apr), +1 month (8 May), +1 month (8 Jun) `[S]` (iTAX, RD Saraburi).
- PND 94 paper: 30 Sep, 31 Oct, 30 Nov `[P]`.
- Missing an installment: right to installments lost; remaining tax due with surcharge.
- Spouses filing jointly: each may choose installments if their share >= 3,000 `[S]`.

### 8.5 Late filing and penalties

| Item | Rule | Source |
|---|---|---|
| Surcharge (เงินเพิ่ม, s.27) | 1.5% per month or part of a month on tax unpaid, from the day after the deadline to payment, **capped at the tax amount** | `[P]` |
| Criminal fine (ค่าปรับ, s.35) | Up to 2,000 baht for not filing on time; can be reduced on settlement. Common settlement amounts (e.g. 200 baht) appear only in non-official sources | `[P]` cap, `[UNCONFIRMED]` amounts |
| No tax due, filed late | Fine only, no surcharge | `[P]` (rd.go.th/37392) |
| E-filed but not paid by the deadline | Treated as not filed: go to a branch, pay tax + surcharge + fine | `[P]` (rd.go.th/37392) |
| Amended return after deadline with extra tax | Surcharge, **no fine** | `[P]` (rd.go.th/37392) |
| Penalty (เบี้ยปรับ) on assessment | Not filing (s.22): up to 2x the tax; understatement (s.26): up to 1x the deficiency; reducible under RD regulations; voluntary filing before an audit normally avoids it | `[S]` (general Revenue Code knowledge; RD page does not mention it) |
| Over-refund not returned within 30 days of notice | 7.5% p.a. interest (Civil and Commercial Code s.224) | `[P]` |

### 8.6 Refunds `[P]`

Refunds are paid by PromptPay linked to the taxpayer's 13-digit national ID; the taxpayer must register PromptPay-by-ID at any Thai bank. A paper refund request without signature is not processed. Foreigners without a Thai ID PromptPay: other method `[UNCONFIRMED]`.

---

## 9. Withholding tax (WHT) and the 50 ทวิ

The 50 ทวิ certificate (หนังสือรับรองการหักภาษี ณ ที่จ่าย, s.50 bis) shows income type, amount paid, tax withheld, and for employees PVD/SS amounts. WHT is a **credit** on line 11.15 unless the income was taxed finally and left off the return.

Commonly applied rates when the payer is a company/juristic person (Departmental Order ท.ป.4/2528 and s.50) `[S]` (BillsOS table, PEAK; not read from RD primary text):

| Payment to an individual | WHT |
|---|---|
| Salary 40(1) | Progressive estimate, PND 1 |
| Commissions/fees 40(2) | Progressive estimate under s.50(1), PND 1; many payers withhold 3% in practice |
| Services, hire of work, contracting 40(6) to (8) | 3% |
| Rent 40(5) | 5% |
| Advertising | 2% |
| Transport (non-public) | 1% |
| Prizes, contests, lucky draws | 5% |
| Resident public entertainers | 5% |
| Interest (deposits, bonds) | 15% (final option) |
| Dividends (Thai companies, funds) | 10% (final option) |
| Government lottery | none (0.5% stamp duty) |
| Charity lottery | 1% |
| Land office on non-trade real estate | progressive formula on appraised value |
| Payments under 1,000 baht per contract | no WHT (ท.ป.4/2528 cl.12/7) |

Individuals paying individuals generally do not withhold, so such income has no credit. e-Withholding Tax reduced rates (1%) applied to 2568 and were being extended by MR 402 (2569) `[UNCONFIRMED]` for details. The engine should take WHT as user input per 50 ทวิ rather than deriving it.

---

## 10. Residency, non-residents, edge cases

- **Resident**: 180+ days in Thailand in the calendar year (aggregate) `[P]`. Residents: Thai-source income always taxable; foreign-source taxable when remitted (4.7).
- **Non-resident**: taxable only on Thai-source income (paid in Thailand or from work/business/property in Thailand), regardless of where paid `[S]`. Allowances limited: spouse, children, parents, disabled dependents, parents' health insurance only for persons residing in Thailand `[P]`; personal allowance and other items remain `[S]`. Dividend tax credit not available `[P]`. 190,000 exemptions require residency `[P]`.
- Minors (under 20): return filed by the legal representative; deceased during the year: estate administrator/heirs file combining the deceased's and the estate's income for the year `[P]`.
- Joint income through a non-juristic partnership: taxed at partnership level (personal allowance 60,000/120,000) and the partner's share is exempt; out of scope `[S]`.
- No-tax filers: still must file above the thresholds (8.2). Show a "file even though tax is 0" message.
- Refund-only filers below thresholds: allowed and encouraged when WHT exists.
- 40(1) with tax paid by employer on behalf: gross up (tax-on-tax) `[P]`.
- Severance, PVD lump sums and inherited property have their own forms/attachments; keep them out of the main progressive base when the user elects separate treatment.
- Income from a joint home loan or joint construction: split per number of co-borrowers.
- Thai ESG/RMF/annuity 30%/15% tests use gross income, not net (6.1).
- PND 94 credit: tax paid on PND 94 is credited at line 11.15; PND 94 uses half personal allowances (30,000; spouse 30,000; child 15,000, but the 2nd-child-born-2561+ extra stays 30,000 as printed), and spending-based items count only Jan to Jun payments; some caps are split (life insurance: half of the first 10,000 up to 5,000 plus excess up to 90,000) `[P]` (Ins94_160669).

---

## 11. Common errors and traps (surface in UI)

1. Using 300,000 / 300 days as the severance exemption. Correct: 400 days, 600,000, involuntary termination only.
2. Claiming SSF for 2568 or 2569. Not deductible after 2567.
3. Claiming Easy E-Receipt, domestic travel or Thai ESGX new money for 2569. None in force.
4. Thai ESG cap for 2570: drops to 100,000 with 8-year hold. Do not roll 300,000 forward.
5. Parents' health insurance: 15,000 total, not per parent.
6. Parent allowance with an adopted child: not allowed.
7. Child income threshold: < 30,000 non-exempt income, otherwise no allowance.
8. 2nd-child 60,000 applies only to legitimate children born 2561 or later and counts deceased siblings in birth order.
9. Social security max: 9,000 for 2568 but 10,500 for 2569 (s.33). Many sites still say 9,000.
10. Donations: 10% caps use income **after** allowances; 2x donations come first; from 2569 non-e-Donation receipts to temples/foundations are not deductible.
11. 40(3): goodwill and other rights also get 50%/100,000 (not only copyright); annuities from wills/courts get nothing.
12. Fine arts 40(6): 60% from 2568 (was 30%).
13. 40(8) categories: all 60% except performers (60/40, max 600,000) and "others" (actual). Old 65%/70%/80%/85% tables are obsolete.
14. Freelance service income is usually 40(2) sharing the 100,000 cap with salary, not 40(8) 60%.
15. Dividends: all-or-nothing with fund distributions; credit only when included; foreign dividends cannot take 10% final.
16. Including final-taxed income (15% interest, 10% dividends) can still raise the RMF/ESG/annuity base via ข้อ 10 without being taxed.
17. 0.5% minimum tax: base excludes 40(1) and the dividend credit; only matters above 1,000,000 non-salary gross.
18. 190,000 exemption reduces gross income before the 50% expense calculation; it can be spread across categories.
19. Retirement 500,000 cap includes PVD (incl. the first 10,000), GPF, teacher fund, NSF, RMF and annuity, but not Thai ESG.
20. Annuity premiums must first fill unused life-insurance room within 100,000.
21. PVD over 15% of wages: excess not exempt.
22. E-filed returns not paid by the deadline count as not filed.
23. Late amended returns: surcharge but no fine; surcharge capped at tax.
24. 2568 education/sports donations at 2x became valid retroactively in Oct 2569 (Royal Decrees 809/810); returns filed earlier at 1x can be amended.
25. Foreign remittances: the proposed "same or next year" exemption is not law; Por. 161/162 still apply to 2569.
26. Crypto: only licensed Thai platforms are exempt 2568 to 2572.
27. Solar rooftop: 200,000 once per person, e-Tax Invoice only, tax year of grid connection.
28. New-house construction: claimed in the year construction finishes, even if that is 2569.
29. Spouse allowance is lost when both spouses have income and file separately.
30. The 150,000 zero bracket does not apply to severance or real-estate separate computations.

---

## 12. Suggested engine configuration shape

```ts
type TaxYear = 2568 | 2569;

interface YearRules {
  brackets: { upTo: number | null; rate: number }[];      // section 2.1
  minTax: { threshold: 120_000; rate: 0.005; floor: 5_000 };
  employmentExpense: { rate: 0.5; cap: 100_000 };
  socialSecurityMax: { s33: number; s39: number };         // 2568: 9000/5184, 2569: 10500/5184?
  thaiEsg: { pct: 0.3; cap: number; holdYears: number };   // 300k/5 for both years
  esgxNew: { pct: 0.3; cap: number } | null;               // 2568 only
  esgxLtfTranche: "first300k" | "quarterOfExcess";         // 2568 vs 2569
  easyEReceipt: { general: 30_000; community: 20_000 } | null; // 2568 only
  travel: { tier1: 10_000; tier2: 10_000; secondaryMultiplier: 1.5 } | null; // 2568 only
  solar: { cap: 200_000 } | null;                          // 2569+
  newHouse: { perMillion: 10_000; cap: 100_000 };          // by completion year
  art: { cap: 100_000 };                                   // 2568 to 2570
  eDonationOnlyForCharities: boolean;                      // false 2568, true 2569
  donation2xEducationSports: boolean;                      // true both (retroactive)
  pending: { floodRepair2569?: { home: 100_000; vehicle: 30_000 } };
}
```

Keep every amount in a per-year table so 2570 (TISA, Thai ESG 100,000/8 years) can be added without code changes.

---

## 13. Worked test vectors (computed from the rules above)

1. **2568, single, salary only.** Salary 600,000; PVD 30,000 (5%); SS 9,000; life insurance 20,000.
   40(1) line = 600,000 - 20,000 (PVD exempt part) = 580,000; expense min(290,000, 100,000) = 100,000; income after expense 480,000. Allowances 60,000 + 9,000 + 10,000 (PVD first part) + 20,000 = 99,000. Net 381,000. Tax = 7,500 + 81,000 x 10% = **15,600**.
2. **Minimum tax.** 2569, single, 40(8) trading 3,000,000 with actual expenses 2,900,000. Income after expenses 100,000; minus 60,000 = 40,000; progressive tax 0; alt = 3,000,000 x 0.005 = 15,000 > 5,000, so tax = **15,000**. With 60% flat instead: 1,200,000 - 60,000 = 1,140,000, progressive 115,000 + 140,000 x 25% = 150,000 > 15,000, so **150,000**.
3. **Dividend credit.** Thai dividend 80,000 from profits taxed at 20%, WHT 8,000. If included: income +80,000 +20,000 credit = 100,000; credits at line 11.15 = 8,000 + 20,000.
4. **Severance separate.** 10 years of work, taxable PVD employer part + earnings 400,000 (type B, full base). exp1 = 70,000; exp2 = 50% x 330,000 = 165,000; net = 165,000; tax (no 150,000 exemption) = 165,000 x 5% = **8,250**, less WHT on the certificate.
5. **Inherited land, separate.** Sale 3,000,000, held 5 years, flat 50%: net 1,500,000; per year 300,000; tax per year (no exemption) 15,000; x 5 = **75,000** (below 20% x 3,000,000 = 600,000 cap).

---

## 14. Items not confirmed or pending (as of 4 Nov 2026)

1. PND 90/91 e-filing deadline for tax year 2569 (8 Apr 2570): depends on renewal of the MoF 8-day extension, which reportedly covers deadlines only up to 1 Jan 2570.
2. Any new 2569 stimulus deduction (Easy E-Receipt / ช้อปดีมีคืน 2569, travel 2569): none found; could still be announced before 31 Dec 2569.
3. Flood repair deduction 2569 (100,000 home / 30,000 vehicle): Cabinet-approved, no Ministerial Regulation yet.
4. TISA and the 800,000 combined cap: not law; targeted for 2570.
5. Foreign-income remittance exemption (same or next year): not law as of 19 Oct 2026.
6. Section 39 social security maximum for 2569 (assumed 5,184 unchanged).
7. Thai ESGX new money in 2569 sharing the Thai ESG cap: from AMC/Finnomena, Ministerial Regulation text not read.
8. Crypto loss-offset legal instrument and whether foreign-exchange crypto gains are treated as foreign-source.
9. Domestic travel 2568: district-level secondary areas inside main provinces, and the official allocation order for mixed main/secondary spending.
10. New-house construction: rounding of partial millions (floor assumed).
11. Spouse allowance when marriage occurred during the year; child allowance mechanics in a joint (combined) return.
12. Exact settlement fines for late filing (only the 2,000 baht cap is official); เบี้ยปรับ rules from the Revenue Code not re-read here.
13. WHT rate table: from secondary sources; e-Withholding 1% extension details (MR 402, 2569).
14. Lottery treatment beyond government lottery (charity lottery 1% final), and the 24-month tax-free deposit rules.
15. Refund method for foreigners without a Thai-ID PromptPay.
16. Foreign tax credit computation method (pro-rata) and DTA-only restriction.
17. NSF contribution ceiling of 30,000 per year (secondary only).
18. Whether the 0.5% minimum tax is computed on combined income in a joint return.

---

## 15. Sources

Primary (RD / Royal Gazette):
- PND 90 instructions, tax year 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Ins90_241268.pdf
- PND 91 instructions, tax year 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Ins91_241268.pdf
- PND 90 form 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/241268PIT90.pdf
- Deductions attachment (ใบแนบ ล.ย.) 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/241268attach.pdf
- Severance separate-tax attachment 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/9091out_241268.pdf
- Foreign income sheet 2568: https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Foreign_Income_241268-v2.pdf
- PND 94 instructions, tax year 2569: https://www.rd.go.th/fileadmin/tax_pdf/pit/2569/Ins94_160669.pdf
- RD forms pages: https://www.rd.go.th/67335.html (2568), https://www.rd.go.th/68191.html (2569)
- RD new laws list (Royal Decrees 800 to 810, DG 462 to 471, MR 402/403, MoF disaster notice No. 18): https://www.rd.go.th/21221.html
- RD Ministerial Regulations list (MR 390 to 403): https://www.rd.go.th/6160.html ; Royal Decrees: https://www.rd.go.th/1603.html
- RD severance analysis manual: https://www.rd.go.th/fileadmin/download/leave_of_work.pdf
- RD late filing guidance: https://www.rd.go.th/37392.html
- RD Clear Cut allowances Q&A: https://www.rd.go.th/62777.html ; https://www.rd.go.th/61117.html
- RD expense deduction table (40(3)): https://www.rd.go.th/556.html
- RD savings interest ruling: https://www.rd.go.th/26901.html
- Solar Royal Decree 805 (Parliament library record): https://prt.parliament.go.th/items/4423b851-7842-4193-af0b-eff51af762bb

Secondary:
- Arnajak Accounting, 2569 deductions checklist (16 Oct 2026): https://www.arnajak-karnbanchee.co.th/blog/17602/
- HeyGoody 2569 deduction list: https://www.heygoody.com/th/blogs/lifestyle/tax-deductions-list/
- KAsset Thai ESG / ESGX conditions: https://www.kasikornasset.com/th/ltfrmfcondition/pages/thaiesg.aspx
- Finnomena Thai ESGX: https://www.finnomena.com/finnomenafunds/thaiesg-extra/
- Social security ceiling 17,500 / 875: https://www.thaipbs.or.th/news/content/359071 ; https://www.humansoft.co.th/th/blog/pay-social-security ; https://www.krungsri.com/th/krungsri-the-coach/life/good-life/sso-section-33-rate-increase
- Section 39 contribution 5,184: https://www.matichon.co.th/local/news_4439897
- Solar rooftop conditions: https://www.thansettakij.com/economy/energy/652936 ; https://www.teragroup.co.th/solar-e-tax-exemption-2569-2571-conditions/
- 2x education/sports donation extension: https://www.voicetv.co.th/read/wvBK75-Dy ; https://www.thaipbs.or.th/news/content/507149 ; https://www.bangkokbiznews.com/economics/1218136
- Flood relief 2569: https://www.sanook.com/money/959823/
- Easy E-Receipt 2569 status: https://www.bangkokbiznews.com/economics/1214725 ; https://www.grandlinux.com/blogs/easy-e-receipt-2569.html
- Travel 2568: https://thaipublica.org/2025/10/cabinet-approves-5-tourism-packages-secondary-cities-tax-deduction-30000-baht/ ; https://www.traveloka.com/th-th/explore/destination/tax-deductible-travel/1002635
- TISA status: https://thaipublica.org/2026/02/ekaniti-tisa-tax-deduction-middle-income-savings/ ; https://www.kaohoon.com/news/local/862412 ; https://www.nationthailand.com/business/economy/40068880
- Crypto MR 399: https://www.itax.in.th/media/%E0%B8%A2%E0%B8%81%E0%B9%80%E0%B8%A7%E0%B9%89%E0%B8%99%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B5%E0%B8%81%E0%B8%B3%E0%B9%84%E0%B8%A3%E0%B8%88%E0%B8%B2%E0%B8%81%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%82%E0%B8%B2/ ; https://www.pptvhd36.com/wealth/stock-investment/256476
- Crypto loss offset (RD manual coverage): https://www.thairath.co.th/money/economics/thai_economics/2300245
- Foreign income: https://www.thailawonline.com/thailand-remittance-tax-exemption-status/ ; https://brerrabbitlegal.co.th/insights/thailand-remittance-tax-exemption-2026-status/ ; https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/tax-rules-on-foreign-sourced-income
- E-filing 8-day extension: https://www.humansoft.co.th/th/blog/submit-tax-returns-online ; https://www.prd.go.th/th/content/category/detail/id/39/iid/484999
- Installments: https://www.itax.in.th/pedia/%E0%B8%9C%E0%B9%88%E0%B8%AD%E0%B8%99%E0%B8%8A%E0%B8%B3%E0%B8%A3%E0%B8%B0%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B5/
- PVD withdrawals: https://www.set.or.th/th/about/setsource/insights/article/269-pvd ; https://www.kasikornasset.com/th/tax/Pages/provident-fund.aspx
- SSF end: https://www.thaipbs.or.th/now/content/564499
- Fine arts 60% (Cabinet Aug 2568): https://thestandard.co/govt-tax-measures-art/
- WHT rates: https://billsos.com/guide/withholding-tax-rates
- Government lottery: https://thaipublica.org/2022/10/revenue-department-check-tax-lottery-winner/
- Savings interest consent: https://www.krungsri.com/th/about-krungsri/about-us/overview/announce/exemption-tax-interest-savings-deposit
