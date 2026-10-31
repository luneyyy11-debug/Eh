# Mobile Phone Shop System — TODO

**Project type:** Offline-first, installable website (PWA)  
**Languages:** Sorani Kurdish (کوردی سۆرانی) and English  
**Currencies:** Iraqi dinar (IQD) and US dollar (USD)  
**Main device:** Android tablet  
**Barcode hardware:** USB barcode scanner (keyboard/HID mode)  
**Hosting:** Netlify  
**Shared data:** Multiple shop devices

---

## 1. What the system should do

Build a simple shop dashboard where the owner can choose a phone from a prepared catalogue, enter that physical phone's details, and add it to stock. The catalogue should already contain brands, model names, and model pictures so the owner does not have to type the phone name every time.

Every physical phone must have its own stock record and unique barcode. When the phone is sold, scan its barcode, confirm the sale, and remove that exact unit from available stock. The system should keep the sale record for reports and history.

### Main workflow

1. Open **Add to Stock**.
2. Choose a brand (iPhone, Samsung, Redmi, POCO, Infinix, etc.).
3. Choose the model from picture cards. Search and filter the catalogue when needed.
4. Choose or enter the model variant: RAM, storage, colour, region/version, and condition.
5. Enter the phone's individual details, such as battery health, IMEI/serial number if needed, purchase price, and selling price.
6. Generate or scan a barcode for that physical unit, then save it.
7. To sell it, scan its barcode, check the phone and price shown on screen, and press **Confirm Sale**.
8. The phone becomes **Sold** and is no longer counted as available stock. Its sale stays in the sales history.

---

## 2. Recommended implementation approach

Use a **PWA + local database + cloud database**. This gives the project a website address on Netlify while allowing it to be installed on Android and used offline after its first successful load.

| Part | Recommendation | Purpose |
|---|---|---|
| Front end | React + TypeScript + Vite | Build the screens and application |
| Install/offline support | PWA service worker, for example `vite-plugin-pwa` | Cache the app files so it can open offline |
| Local database | Dexie.js (IndexedDB) | Keep catalogue, cached stock, and pending actions on each device |
| Shared database | Supabase (PostgreSQL) | Store the shop's shared stock, sales, users, and settings |
| Login/security | Supabase Auth + database Row Level Security | Owner and staff accounts with permissions |
| Hosting | Netlify | Publish the built website over HTTPS |
| Barcode | USB scanner in keyboard/HID mode + Code 128 labels | Scan units quickly; generate labels for phones without a usable barcode |
| Translation | `react-i18next` or a simple typed translation dictionary | Switch between English and Sorani Kurdish |

**Why this approach:** Netlify hosts the website; it is not the inventory database. Supabase stores the shared shop data. Dexie stores a local copy so the app can still work when the internet is unavailable. A service worker caches the app itself, while IndexedDB stores the shop data. Do not rely on browser local storage for the main stock database.

### Important offline and multi-device limitation

- Each device can continue using its own previously downloaded data while offline. Changes are saved locally and placed in a **Pending Sync** queue.
- Those offline changes cannot instantly appear on another disconnected device. They sync when that device reconnects to the internet.
- There is a real risk that two disconnected devices could both try to sell the same phone. The server must validate each sale when it syncs. If another device already sold that unit, flag the second action as a **Sync Conflict** for the owner to resolve; never silently overwrite the first sale.
- If the shop must keep all devices in sync with one another during an internet outage, a separate shop-local server on the local Wi-Fi network is required. Netlify alone cannot provide that. Treat local-network server support as a later phase unless it is a strict launch requirement.
- The app must first be opened online so it can download and cache its files and catalogue. Test offline launch on the actual Android tablet and browser before relying on it in the shop.

**Recommended first release:** Netlify + Supabase + Dexie, with offline actions queued safely and conflicts clearly shown. Add a shop-local server only if the shop needs devices to share changes while the internet is down.

---

## 3. Project setup

- [ ] Create a Git repository for the project.
- [ ] Create a React + TypeScript + Vite project.
- [ ] Set up a clear folder structure:
  - [ ] `src/components/` — reusable buttons, dialogs, cards, forms, and tables.
  - [ ] `src/pages/` — Dashboard, Stock, Add Stock, Sales, Reports, Settings, Login.
  - [ ] `src/db/` — Dexie local database and schema versions.
  - [ ] `src/services/` — Supabase calls, sync queue, barcode, currency, and backup services.
  - [ ] `src/i18n/` — English and Sorani translation files.
  - [ ] `src/types/` — shared TypeScript data types.
  - [ ] `public/catalog/` — locally stored catalogue pictures/thumbnails.
  - [ ] `public/icons/` — PWA icons.
  - [ ] `supabase/migrations/` — database tables, constraints, and security policies.
- [ ] Add ESLint and formatting rules.
- [ ] Create `.env.example` documenting required environment variable names (without real secrets).
- [ ] Add `.env` to `.gitignore`.
- [ ] Create a development version with sample/demo data before connecting real shop data.

---

## 4. Design the main screens

- [ ] **Login** — owner/staff sign-in.
- [ ] **Dashboard** — total in-stock phones, total stock value, today's sales, and pending sync/conflict alerts.
- [ ] **Add to Stock** — large brand/model picture cards and a short form.
- [ ] **Stock** — searchable list of individual phones, with filters for brand, model, storage, condition, and status.
- [ ] **Phone Details** — picture, variant, battery health, barcode, prices, and stock history.
- [ ] **Sell Phone** — large scan field, matched phone details, price, optional discount, and confirm button.
- [ ] **Sales History** — searchable receipts and sale details.
- [ ] **Reports** — daily/weekly/monthly sales, stock value, and profit.
- [ ] **Catalogue Manager** — add or edit phone brands, models, variants, and pictures.
- [ ] **Settings** — language, exchange rate, shop information, users, backups, and sync status.
- [ ] Make buttons and inputs large enough for tablet touch use.
- [ ] Use clear confirmation dialogs for selling, deleting, returning, or changing a price.
- [ ] Show visible status labels: In Stock, Sold, Pending Sync, Sync Conflict, Returned, and Repair.

---

## 5. English and Sorani Kurdish support

- [ ] Add an easy language switch: **English / کوردی سۆرانی**.
- [ ] Translate every button, title, menu, form label, validation message, empty state, receipt, and report.
- [ ] Use a Kurdish-compatible font and bundle the font locally so text still displays offline.
- [ ] English mode: `lang="en"` and left-to-right layout.
- [ ] Sorani mode: `lang="ckb"` and right-to-left layout.
- [ ] Use CSS logical properties (such as `margin-inline-start`) instead of assuming left/right everywhere.
- [ ] Check that icons, navigation, dialogs, tables, and forms are mirrored correctly in Sorani mode.
- [ ] Keep barcode values, IMEI/serial numbers, model codes, and numeric identifiers left-to-right even when the rest of the screen is RTL.
- [ ] Keep currency codes clear (`IQD`, `USD`) and format amounts consistently.
- [ ] Ask a fluent Sorani speaker to review the translations before using the system in the shop.

---

## 6. Phone catalogue (preloaded models with pictures)

### Brands to include initially

- [ ] Apple — iPhone
- [ ] Samsung — Galaxy S, Galaxy A, Galaxy Z (and other models the shop sells)
- [ ] Xiaomi — Redmi and Xiaomi models
- [ ] POCO
- [ ] Infinix
- [ ] Tecno   
- [ ] Add other brands later through Catalogue Manager.

### Catalogue features

- [ ] Show brands as selectable cards or tabs.
- [ ] Show models as picture cards with brand and model name.
- [ ] Add search by brand/model name and quick filters.
- [ ] Add a model without changing application code.
- [ ] Allow the owner to upload/change a model picture.
- [ ] Store catalogue images locally in the app or cache them after download so they are available offline.
- [ ] Use supplier-provided, shop-owned, or appropriately licensed pictures. Do not assume images copied from random websites are free to reuse.
- [ ] Seed only the models the shop actually sells; keep the catalogue editable because new models are released frequently.

### Suggested catalogue data

Each model template should have:

- [ ] Brand.
- [ ] Model name (for example, iPhone 15 Pro, Galaxy A55, Redmi Note 13, POCO X6, Infinix Note series).
- [ ] Model image/thumbnail.
- [ ] Optional model family/category.
- [ ] Optional specifications shown to help identify the model.
- [ ] Active/hidden flag so old models can be hidden without deleting old stock history.

A model template is not a stock item. The catalogue describes the model; each actual phone added to the shop becomes a separate inventory unit with its own barcode and condition.

---

## 7. Add-to-stock form

The owner should be able to add a phone with as few steps as possible.

### Step A — Choose the phone

- [ ] Select brand.
- [ ] Select model using picture cards.
- [ ] Select or create the variant.

### Step B — Enter the variant and physical phone details

- [ ] RAM (for example, 8 GB).
- [ ] Storage (for example, 128 GB / 256 GB / 512 GB / 1 TB).
- [ ] Colour.
- [ ] Region/version (optional, e.g. Global or other region).
- [ ] Network/SIM version (optional).
- [ ] Condition: New / Used / Refurbished.
- [ ] Battery health percentage (0–100, optional when unknown or not applicable). Label this **Battery Health**, not current charge level.
- [ ] IMEI 1 / IMEI 2 (optional; validate length and prevent duplicates when entered).
- [ ] Serial number (optional).
- [ ] Supplier/source (optional).
- [ ] Date received.
- [ ] Notes (optional).

### Step C — Prices

- [ ] Purchase cost and its currency (IQD or USD).
- [ ] Selling price and its currency (IQD or USD).
- [ ] Allow the owner to enter prices directly in either currency.
- [ ] Add a configurable exchange rate: how many IQD equal 1 USD.
- [ ] Show an approximate converted price in the other currency when useful.
- [ ] Allow manual price override; do not force conversion.
- [ ] Save the exchange rate used with the sale so old receipts and profit reports do not change when the owner updates today's rate.
- [ ] Use precise decimal/integer-safe money handling; do not use ordinary floating-point arithmetic for financial calculations.

### Step D — Barcode and save

- [ ] Generate a unique internal barcode for each physical phone if it does not already have a barcode that the shop wants to use.
- [ ] Use Code 128 for internal labels.
- [ ] Allow scanning an existing barcode into the form.
- [ ] Check that every barcode is unique before saving.
- [ ] Show a preview of the barcode and phone details.
- [ ] Save the phone as **In Stock**.
- [ ] Offer **Save & Add Another** for adding several phones quickly.
- [ ] Offer barcode-label printing after saving.

### Fast entry improvements

- [ ] Remember the last selected brand/model/variant to speed up repeated entries.
- [ ] Support adding multiple units of the same model in one session, but create a separate unit record and barcode for each physical phone.
- [ ] Do not copy the same IMEI, serial number, battery health, or barcode to every unit in a batch.

---

## 8. Barcode scanner and labels

- [ ] Test the USB scanner with the Android tablet using an OTG adapter if required.
- [ ] Configure the scanner to act as a keyboard (USB HID/keyboard mode).
- [ ] Configure a suffix such as Enter/Return if the scanner supports it.
- [ ] Keep a dedicated scan input focused on the Sell Phone and Stock Search screens.
- [ ] Handle fast scanner input without requiring the owner to tap every character.
- [ ] After a scan, look up the exact phone unit and display its model picture, variant, battery health, status, and selling price.
- [ ] Show a clear message for unknown barcodes, already-sold phones, duplicate codes, and damaged/unreadable labels.
- [ ] Generate printable Code 128 labels with barcode, short model name, and a readable short ID.
- [ ] Make label layout adjustable for the shop's label printer/paper size.
- [ ] Keep manual barcode search available if the scanner stops working.
- [ ] Optional later feature: use the tablet camera to scan barcodes as a backup.

---

## 9. Selling a phone

- [ ] Open Sell Phone and scan the phone's barcode.
- [ ] Display the matched model picture and exact unit details.
- [ ] Confirm that its status is In Stock before allowing the sale.
- [ ] Show the current selling price and currency.
- [ ] Allow the owner/cashier to change the sale price if their role permits it.
- [ ] Allow an optional discount with a reason.
- [ ] Choose sale currency: IQD or USD.
- [ ] Record payment method if needed (cash, bank/card, or other).
- [ ] Optionally enter customer name/contact; do not require customer details for every sale.
- [ ] Generate a unique receipt/invoice number.
- [ ] Show a final confirmation before completing the sale.
- [ ] Mark the unit Sold only after the sale is accepted locally; mark it Pending Sync when offline.
- [ ] When online, have the server verify the unit is still available before finalizing the shared sale.
- [ ] Prevent the same unit from being sold twice in the shared database.
- [ ] Save who sold it, when it was sold, the final price, currency, discount, and exchange-rate snapshot.
- [ ] Show a printable/shareable receipt in English or Sorani.
- [ ] Never permanently delete a completed sale. Use a return, cancellation, or reversal record so the audit history remains.

---

## 10. Stock management

- [ ] Show the total number of available phones.
- [ ] Show stock grouped by brand and model.
- [ ] Show each physical unit separately when opening a model.
- [ ] Search by model, barcode, IMEI, serial number, or short stock ID (where permitted).
- [ ] Filter by brand, model, storage, RAM, colour, condition, battery health, and status.
- [ ] Show purchase cost, selling price, and expected margin only to authorized users.
- [ ] Allow price edits with an audit record of the old and new values.
- [ ] Allow a phone to be marked Returned, Repair, Reserved, or Written Off with a reason.
- [ ] Keep sold and returned phones in history; do not erase them from the database.
- [ ] Add stock adjustment records for corrections, with reason and staff member.

---

## 11. Dashboard and reports

- [ ] Total phones currently in stock.
- [ ] Stock count by brand/model.
- [ ] Total stock purchase value.
- [ ] Estimated stock selling value.
- [ ] Today's sales count and total sales in IQD and USD separately.
- [ ] Daily, weekly, and monthly sales reports.
- [ ] Gross profit report using each sale's saved purchase cost and exchange-rate snapshot.
- [ ] Best-selling models.
- [ ] Stock movement history: added, sold, returned, adjusted, repaired.
- [ ] Search/filter reports by date, brand, model, staff member, and currency.
- [ ] Export reports to CSV.
- [ ] Clearly distinguish revenue, profit, and stock value; they are not the same figure.

---

## 12. Data structure (database plan)

Use unique IDs for records. Keep catalogue templates separate from individual physical phones.

### Main tables

- [ ] `shops` — shop name, settings, default language, exchange rate, and shop ID.
- [ ] `users` — account/profile, shop ID, and role.
- [ ] `brands` — brand names and logo/image if used.
- [ ] `phone_models` — brand ID, model name, image, specifications, active flag.
- [ ] `phone_variants` — model ID, RAM, storage, colour, region/version, and other variant fields.
- [ ] `inventory_units` — one row per physical phone: variant, unique barcode, condition, battery health, optional IMEI/serial, costs/prices, date received, and current status.
- [ ] `sales` — invoice number, staff member, date/time, customer (optional), currency, totals, discounts, and exchange-rate snapshot.
- [ ] `sale_items` — the exact inventory unit sold, sale price, cost snapshot, and currency details.
- [ ] `stock_movements` — additions, sales, returns, repairs, adjustments, and who performed them.
- [ ] `sync_operations` — unique operation ID, device ID, action payload/status, created time, and sync result.
- [ ] `audit_logs` — important edits and actions, with user, timestamp, and reason.

### Rules and constraints

- [ ] Barcode must be unique within the shop.
- [ ] IMEI/serial must be unique when supplied, where appropriate.
- [ ] One physical inventory unit can have no more than one accepted completed sale at a time.
- [ ] A sale and its sale-item records must be committed together in one database transaction.
- [ ] A unit's status changes must be recorded in stock movement history.
- [ ] Store the currency with every money amount. Never assume an amount is IQD or USD without its currency field.
- [ ] Store the sale-time exchange rate and original amounts; changing today's exchange rate must not rewrite old transactions.
- [ ] Use database constraints and server-side validation, not only front-end checks.

---

## 13. Offline mode and synchronization

- [ ] Cache the app shell, styles, scripts, icons, and required fonts using the PWA service worker.
- [ ] Store catalogue, model images/thumbnails, cached stock, and sales needed by the device in Dexie/IndexedDB.
- [ ] Show a clear Online / Offline indicator.
- [ ] Show the time of the last successful sync.
- [ ] Save offline stock additions and sales into a local pending-operation queue.
- [ ] Give every operation a unique ID so retrying a sync cannot create duplicate sales or stock additions.
- [ ] Retry pending operations when the connection returns and when the user presses **Sync Now**.
- [ ] Do not assume background sync will always run; provide a visible manual sync button and sync on app open/foreground.
- [ ] Download changes from the shared database and update the local cache.
- [ ] Use server-side checks/transactions for stock sales and other operations that must not conflict.
- [ ] Display successful, waiting, failed, and conflicting operations separately.
- [ ] Provide an owner-only conflict screen with the affected phone, device, time, and reason.
- [ ] Never silently discard an offline sale, stock addition, or edit.
- [ ] Provide a safe recovery/export option before clearing local data or signing out.
- [ ] Test closing/reopening the browser while offline and verify that locally saved work remains.
- [ ] Test two devices making changes to the same phone while disconnected; verify that conflicts are caught after reconnecting.

---

## 14. Accounts, permissions, and security

- [ ] Owner account can manage everything, including staff, catalogue, settings, prices, and reports.
- [ ] Cashier role can search stock and complete permitted sales but cannot edit sensitive settings or erase records.
- [ ] Optional manager role can manage stock and returns without changing owner access.
- [ ] Require sign-in for shop data.
- [ ] Enable Supabase Row Level Security (RLS) on every exposed table and write policies restricting records to the correct shop and permitted role.
- [ ] Keep secret/service-role keys on a trusted server only; never put them in browser code or a public Git repository.
- [ ] Put only the public Supabase project URL and publishable/anonymous client key in the front end, protected by correct RLS policies.
- [ ] Do not display full IMEI/serial values to staff who do not need them.
- [ ] Record important edits, sales, returns, and stock adjustments in an audit trail.
- [ ] Add automatic session expiry/sign-out controls for shared shop tablets.
- [ ] Make backup and restore procedures before real use.

---

## 15. Netlify deployment

- [ ] Connect the project Git repository to Netlify.
- [ ] Set build command to `npm run build`.
- [ ] Set publish directory to `dist` for a standard Vite build.
- [ ] Add required public environment variables in Netlify site settings.
- [ ] Add the SPA fallback/redirect if using client-side routing.
- [ ] Verify that the deployed site uses HTTPS.
- [ ] Test PWA installation on the Android tablet using the browser's install/add-to-home-screen option.
- [ ] Open the deployed app online at least once, then turn off internet and test it again.
- [ ] Test a new deployment/update and confirm that the service worker updates safely without deleting local unsynced data.
- [ ] Keep database schema changes in versioned migrations; do not rely on manually changing production tables without recording the change.

---

## 16. Testing checklist before real shop use

### Stock and prices

- [ ] Add one new iPhone and one used Android phone.
- [ ] Add multiple units of the same model and confirm each gets a different barcode.
- [ ] Confirm the correct battery health and variant appear on each unit.
- [ ] Enter one price in IQD and another in USD.
- [ ] Change the exchange rate and confirm old receipts/reports do not change.
- [ ] Confirm stock totals update correctly after adding and selling units.

### Barcode and selling

- [ ] Scan a valid barcode with the USB reader.
- [ ] Scan an unknown barcode.
- [ ] Scan an already-sold phone.
- [ ] Sell a phone in IQD and another in USD.
- [ ] Confirm the receipt contains the correct model, price, currency, and invoice number.
- [ ] Return a sold phone and verify the history remains intact.

### Language and tablet layout

- [ ] Check every screen in English.
- [ ] Check every screen in Sorani Kurdish RTL mode.
- [ ] Check mixed RTL text with Latin model names, numbers, currency, and barcodes.
- [ ] Check buttons, forms, tables, and dialogs on the Android tablet.
- [ ] Check the USB scanner with the actual tablet and OTG setup.

### Offline and multiple devices

- [ ] Install/open the app online, then reload it offline.
- [ ] Add a phone while offline and confirm it remains saved after closing/reopening the app.
- [ ] Record a sale while offline and confirm it appears as Pending Sync.
- [ ] Reconnect and confirm the action syncs exactly once.
- [ ] Use two devices online and confirm stock changes appear on both.
- [ ] Use two devices offline and attempt to sell the same phone; confirm a conflict is caught during sync.
- [ ] Confirm that no pending data disappears after a page refresh, app update, or temporary network failure.

---

## 17. Build order (do this in stages)

### Stage 1 — Working prototype

- [ ] Build the responsive dashboard and navigation.
- [ ] Add English and Sorani language switching, including RTL layout.
- [ ] Create sample phone brands/models with local pictures.
- [ ] Build Add to Stock and Stock screens using local demo data.
- [ ] Generate unique barcodes and test the USB scanner.
- [ ] Build the Sell Phone flow and local sales history.

### Stage 2 — Real database and staff accounts

- [ ] Create the Supabase project and database migrations.
- [ ] Add authentication and owner/staff roles.
- [ ] Add database security policies and test them.
- [ ] Connect catalogue, stock, sales, and reports to Supabase.
- [ ] Add audit history and server-side sale validation.

### Stage 3 — Offline-first and sync

- [ ] Add the PWA manifest and service worker.
- [ ] Add Dexie local database and cache required catalogue data.
- [ ] Add the pending-operation queue and retry logic.
- [ ] Add conflict detection and owner review screen.
- [ ] Test with two real devices and unreliable internet.

### Stage 4 — Reports, receipts, and launch

- [ ] Finish IQD/USD reports and exchange-rate snapshots.
- [ ] Finish printable barcode labels and receipts.
- [ ] Add CSV export and backup/restore.
- [ ] Deploy to Netlify and test the installed PWA offline.
- [ ] Enter the shop's real catalogue and test with a small number of phones before moving all stock into the system.
- [ ] Train the owner/staff and write a one-page usage guide in both languages.

---

## 18. Keep these features for later (do not delay the first release)

- [ ] Camera barcode scanning as a backup to the USB reader.
- [ ] Thermal receipt printer integration and custom receipt design.
- [ ] Supplier management and purchase invoices.
- [ ] Customer purchase history and warranty tracking.
- [ ] Repair-service tracking.
- [ ] Multiple shop branches.
- [ ] Shop-local network server for real-time sharing when the internet is down.
- [ ] More detailed profit, supplier, and staff performance reports.

---

## 19. Useful documentation

- [Netlify — Vite deployment guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Vite — static deployment](https://vite.dev/guide/static-deploy.html)
- [MDN — offline and background operation for PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Dexie.js — IndexedDB wrapper and local database](https://dexie.org/docs/Dexie.js)
- [Supabase — JavaScript client](https://supabase.com/docs/reference/javascript/auth)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

