# Domain assumptions to validate with IKIO staff

Every item below is currently hardcoded in the app. **None of it has been
checked against how IKIO actually works** — the original app was AI-generated
and the vocabulary came with it. Take this list to the floor and to each
department, and mark each row.

Legend: `✅ correct` · `✏️ wrong, should be…` · `🗑️ we don't do this — remove`

---

## 1. Structure — who and where

| # | Assumption | Verdict |
|---|---|---|
| 1.1 | Production lines are exactly: **SMT, MI, MI-Finishing, FA-Lum, FA-Ref** | |
| 1.2 | Those lines have fixed sub-lines (Line 1–3, High-Speed Line 4, Wave Solder A/B, Conformal Coating 1, Luminaire Cell A/B, High-Bay Assembly, Reflector Line 1, Retrofit Assembly 2) | |
| 1.3 | There are exactly **3 shifts**, 06:00–14:00, 14:00–22:00, 22:00–06:00 | |
| 1.4 | Every shift is **8 productive hours** (no changeover, breaks, or ramp-up deducted) | |
| 1.5 | Staff roles are: Administrator, Data Entry Staff, Production Supervisor, Store Manager, Quality Inspector | |
| 1.6 | Operators are assigned to specific lines | |

## 2. The core record — what gets entered

| # | Assumption | Verdict |
|---|---|---|
| 2.1 | One record = **one product, one sub-line, one shift** | |
| 2.2 | The person entering data is the person who ran the shift | |
| 2.3 | Data is entered **at end of shift**, not continuously | |
| 2.4 | A shift runs **one product only** (no multi-product shifts) | |
| 2.5 | Rejections are a single number + one reason per shift | |

## 3. Plan vs Achieved — the biggest unknown

| # | Assumption | Verdict |
|---|---|---|
| 3.1 | **"Plan"** = target units for that shift | |
| 3.2 | Plan is auto-calculated as **standard rate × 8 hours** | |
| 3.3 | Each product has one fixed standard rate (17 rates are hardcoded) | |
| 3.4 | The operator may overwrite the auto-filled Plan | |
| 3.5 | **"Achieved"** = good units produced (unclear: does it include units later rejected?) | |
| 3.6 | **Efficiency = achieved ÷ plan**, with no adjustment for downtime or material shortage | |
| 3.7 | **Units per man-hour = achieved ÷ (operators × hours)** — and this is a number IKIO actually uses | |

> **Known gap:** the shift Plan and the work order quantity are unrelated numbers.
> The shift target comes from a rate table, not from what the order still needs.

## 4. Work orders — may not belong at all

| # | Assumption | Verdict |
|---|---|---|
| 4.1 | IKIO plans production as discrete **work orders** | |
| 4.2 | A work order = one product, one line, a quantity, a due date | |
| 4.3 | Work orders are raised **before** production and released to the floor | |
| 4.4 | An order spans **multiple shifts** | |
| 4.5 | Someone specific raises them (planner / production control) | |
| 4.6 | They already exist in another system → **integrate**; or they don't → **create here or drop** | |

## 5. Approvals

| # | Assumption | Verdict |
|---|---|---|
| 5.1 | Every production run needs review and sign-off | |
| 5.2 | Administrators and Quality Inspectors can approve | |
| 5.3 | Statuses are: Pending Approval, Approved, Rejected, Dispatched | |
| 5.4 | Rejecting a run means "redo / fix" — **what actually happens next?** | |
| 5.5 | Approval is a real decision, not a formality | |

## 6. Material shortages

| # | Assumption | Verdict |
|---|---|---|
| 6.1 | Shortages are reported **against a production run** | |
| 6.2 | Categories: IC/Semiconductor, Passives, PCB/MCPCB, Optics/Lenses, Housing/Heatsink, Connectors/Wires, Packaging | |
| 6.3 | Reasons: Supplier Delay, Defective Batch, Line Scrap/Yield Loss, Inward Staging Delay, Short Received, BOM Discrepancy | |
| 6.4 | Severity includes "Critical (Line Stoppage)" | |
| 6.5 | An admin approving a shortage means **stores dispatch material** | |
| 6.6 | This replaces an existing process — **what is that process today?** | |

## 7. Inventory / BOM

| # | Assumption | Verdict |
|---|---|---|
| 7.1 | Stock is tracked per part: current, safety, allocated | |
| 7.2 | Parts have a location and a single supplier | |
| 7.3 | Status is In Stock / Low Stock / Critical Shortage | |
| 7.4 | **Is stock tracked anywhere today?** (Tally, spreadsheet, paper, nowhere) | |
| 7.5 | Should this app own stock, or read it from elsewhere? | |

---

## The questions that decide the architecture

1. **Where does each piece of data live today?** If it already lives in a
   system, integrate. If nowhere, this app owns it and manual entry is right.
2. **What decision does each screen support?** Anything that doesn't change
   somebody's action should be deleted.
3. **What do people record today that this app can't?** Those are the real
   missing features.
4. **Which numbers do supervisors actually quote in meetings?** Those are the
   metrics that matter; the rest is decoration.

## After the conversations

Expect to **remove** more than you add. The app currently carries invented
concepts, and cutting them will make it clearer than any new feature.

Known work to do once requirements are real:

- Move lines, sub-lines, shifts, products and rates **out of the type system
  and into Firestore**, so structure is configured rather than coded.
- Consolidate the efficiency/productivity calculations into one module —
  they are currently duplicated between `storage.ts` and `AdminDashboard.tsx`.
- Add tests around those calculations before redefining them.
