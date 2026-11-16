import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule, CellIsRule
import datetime

wb = openpyxl.Workbook()

# Colors (Modern Executive Palette)
PRIMARY_COLOR = "1F4E79"      # Dark Steel Blue
SECONDARY_COLOR = "2F5597"    # Medium Blue
ACCENT_COLOR = "5B9BD5"       # Soft Blue
LIGHT_BG = "F2F4F8"           # Very soft slate
HEADER_FILL = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
SUBHEADER_FILL = PatternFill(start_color="2F5597", end_color="2F5597", fill_type="solid")
TEAL_FILL = PatternFill(start_color="006666", end_color="006666", fill_type="solid")
GOLD_FILL = PatternFill(start_color="B28900", end_color="B28900", fill_type="solid")
CARD_FILL = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
ZEBRA_FILL = PatternFill(start_color="F9FAFC", end_color="F9FAFC", fill_type="solid")
ALERT_RED_FILL = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")
SUCCESS_GREEN_FILL = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
TOTAL_FILL = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

WHITE_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
TITLE_FONT = Font(name="Calibri", size=16, bold=True, color="1F4E79")
SECTION_FONT = Font(name="Calibri", size=13, bold=True, color="1F4E79")
BOLD_FONT = Font(name="Calibri", size=11, bold=True, color="000000")
REGULAR_FONT = Font(name="Calibri", size=11, color="000000")
CARD_TITLE_FONT = Font(name="Calibri", size=10, bold=True, color="595959")
CARD_VALUE_FONT = Font(name="Calibri", size=18, bold=True, color="1F4E79")
GREEN_VALUE_FONT = Font(name="Calibri", size=18, bold=True, color="276A3C")

THIN_SIDE = Side(border_style="thin", color="D3D3D3")
DARK_SIDE = Side(border_style="medium", color="1F4E79")
DOUBLE_BOTTOM = Side(border_style="double", color="1F4E79")

STANDARD_BORDER = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=THIN_SIDE)
TOTAL_BORDER = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=DOUBLE_BOTTOM)
CARD_BORDER = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=THIN_SIDE)

ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
ALIGN_RIGHT = Alignment(horizontal="right", vertical="center")
ALIGN_LEFT = Alignment(horizontal="left", vertical="center")

CURRENCY_FORMAT = "#,##0.00"
PERCENT_FORMAT = "0.0%"
DATE_FORMAT = "yyyy-mm-dd"

# -------------------------------------------------------------------------
# Sheet 4: الإعدادات والتصنيفات (Settings) - Create first so formulas can reference it
# -------------------------------------------------------------------------
ws_settings = wb.active
ws_settings.title = "الإعدادات والتصنيفات"
ws_settings.sheet_view.rightToLeft = True

ws_settings.merge_cells("A1:F1")
ws_settings["A1"] = "⚙️ إعدادات الميزانية وقوائم البيانات (Settings)"
ws_settings["A1"].font = TITLE_FONT
ws_settings["A1"].alignment = Alignment(horizontal="right", vertical="center")
ws_settings.row_dimensions[1].height = 35

# Table 1: Categories and Proposed Budgets
ws_settings["A3"] = "فئة المصروف"
ws_settings["B3"] = "الميزانية الشهرية المقترحة"
ws_settings["C3"] = "وصف الفئة"
for col in ["A", "B", "C"]:
    cell = ws_settings[f"{col}3"]
    cell.fill = HEADER_FILL
    cell.font = WHITE_FONT
    cell.alignment = ALIGN_CENTER
    cell.border = STANDARD_BORDER

categories_data = [
    ("طعام وسوبرماركت وبقالة", 3500, "المشتريات الغذائية والتموين المنزلي اليومي والأسبوعي"),
    ("فواتير وخدمات منزلية", 1200, "كهرباء، ماء، غاز، إنترنت، صيانة منزلية"),
    ("مواصلات وبنزين وصيانة سيارة", 1500, "وقود، مواصلات عامة، صيانة وتغيير زيت، أوبر/تاكسي"),
    ("أولاد ومصاريف تعليم", 2500, "أقساط مدارس، دروس، أدوات مدرسية ومصاريف شخصية للأولاد"),
    ("صحة وأدوية وعيادات", 800, "أدوية دورية، كشوفات طبية، تحاليل، رعاية صحية"),
    ("ترفيه ومطاعم ونزهات", 1000, "خروجات عائلية، وجبات سريعة ومطاعم، سينما واشتراكات ترفيهية"),
    ("ملابس وعناية شخصية", 1000, "ملابس، أحذية، صالون وحلاقة، مستحضرات شخصية"),
    ("طوارئ ومصاريف نثرية", 1000, "أي مصاريف مفاجئة غير متوقعة أو هدايا ومناسبات"),
]

for idx, (cat, budget, desc) in enumerate(categories_data, start=4):
    ws_settings[f"A{idx}"] = cat
    ws_settings[f"B{idx}"] = budget
    ws_settings[f"C{idx}"] = desc
    
    ws_settings[f"A{idx}"].font = REGULAR_FONT
    ws_settings[f"A{idx}"].alignment = ALIGN_RIGHT
    ws_settings[f"A{idx}"].border = STANDARD_BORDER
    
    ws_settings[f"B{idx}"].font = BOLD_FONT
    ws_settings[f"B{idx}"].alignment = ALIGN_CENTER
    ws_settings[f"B{idx}"].number_format = CURRENCY_FORMAT
    ws_settings[f"B{idx}"].border = STANDARD_BORDER
    
    ws_settings[f"C{idx}"].font = REGULAR_FONT
    ws_settings[f"C{idx}"].alignment = ALIGN_RIGHT
    ws_settings[f"C{idx}"].border = STANDARD_BORDER

# Table 2: Payment Methods
ws_settings["E3"] = "طريقة الدفع"
ws_settings["E3"].fill = SUBHEADER_FILL
ws_settings["E3"].font = WHITE_FONT
ws_settings["E3"].alignment = ALIGN_CENTER
ws_settings["E3"].border = STANDARD_BORDER

payment_methods = [
    "نقداً (كاش)",
    "بطاقة دفع / فيزا (Debit)",
    "بطاقة ائتمان (Credit)",
    "محفظة إلكترونية (Vodafone/STC...)",
    "تحويل بنكي / إنستاباي",
]

for idx, method in enumerate(payment_methods, start=4):
    cell = ws_settings[f"E{idx}"]
    cell.value = method
    cell.font = REGULAR_FONT
    cell.alignment = ALIGN_RIGHT
    cell.border = STANDARD_BORDER

# Table 3: Commitment Statuses
ws_settings["G3"] = "حالة القسط / الجمعية"
ws_settings["G3"].fill = TEAL_FILL
ws_settings["G3"].font = WHITE_FONT
ws_settings["G3"].alignment = ALIGN_CENTER
ws_settings["G3"].border = STANDARD_BORDER

statuses = [
    "تم الدفع",
    "معلق / قيد الانتظار",
    "متأخر",
    "مؤجل",
]

for idx, st in enumerate(statuses, start=4):
    cell = ws_settings[f"G{idx}"]
    cell.value = st
    cell.font = REGULAR_FONT
    cell.alignment = ALIGN_RIGHT
    cell.border = STANDARD_BORDER

# -------------------------------------------------------------------------
# Sheet 2: المصاريف اليومية (Daily Expenses)
# -------------------------------------------------------------------------
ws_daily = wb.create_sheet(title="المصاريف اليومية")
ws_daily.sheet_view.rightToLeft = True

ws_daily.merge_cells("A1:G1")
ws_daily["A1"] = "🛒 سجل تسجيل المصاريف اليومية والشخصية"
ws_daily["A1"].font = TITLE_FONT
ws_daily["A1"].alignment = Alignment(horizontal="right", vertical="center")
ws_daily.row_dimensions[1].height = 35

headers_daily = ["م", "التاريخ", "فئة المصروف (اختر من القائمة)", "البيان / تفاصيل المصروف", "المبلغ", "طريقة الدفع", "ملاحظات"]
col_letters = ["A", "B", "C", "D", "E", "F", "G"]

for col, h in zip(col_letters, headers_daily):
    cell = ws_daily[f"{col}3"]
    cell.value = h
    cell.fill = HEADER_FILL
    cell.font = WHITE_FONT
    cell.alignment = ALIGN_CENTER
    cell.border = STANDARD_BORDER
ws_daily.row_dimensions[3].height = 28

sample_expenses = [
    (1, "2026-11-01", "طعام وسوبرماركت وبقالة", "مشتريات خضار ولحوم أول الشهر", 850, "نقداً (كاش)", "تموين أسبوعي"),
    (2, "2026-11-02", "فواتير وخدمات منزلية", "فاتورة الإنترنت المنزلي فايبر", 350, "محفظة إلكترونية (Vodafone/STC...)", "دفع إلكتروني"),
    (3, "2026-11-03", "مواصلات وبنزين وصيانة سيارة", "تفويل بنزين 95", 420, "بطاقة دفع / فيزا (Debit)", "محطة وقود"),
    (4, "2026-11-04", "أولاد ومصاريف تعليم", "كتب خارجية ومستلزمات مكتبة", 320, "نقداً (كاش)", "للأولاد"),
    (5, "2026-11-05", "صحة وأدوية وعيادات", "صيدلية - فيتامينات وأدوية ضغط", 280, "بطاقة ائتمان (Credit)", ""),
    (6, "2026-11-07", "ترفيه ومطاعم ونزهات", "عشاء عائلي نهاية الأسبوع", 450, "بطاقة ائتمان (Credit)", "مطعم"),
    (7, "2026-11-09", "طعام وسوبرماركت وبقالة", "مشتريات ألبان ومخبوزات", 260, "نقداً (كاش)", ""),
    (8, "2026-11-10", "فواتير وخدمات منزلية", "شحن كارت الكهرباء المنزلي", 300, "تحويل بنكي / إنستاباي", ""),
    (9, "2026-11-12", "ملابس وعناية شخصية", "حلاقة وعناية شخصية", 150, "نقداً (كاش)", ""),
    (10, "2026-11-14", "طوارئ ومصاريف نثرية", "إصلاح سباكة مفاجئ في المنزل", 220, "نقداً (كاش)", "سباك وصيانة"),
    (11, "2026-11-15", "طعام وسوبرماركت وبقالة", "تسوق طلبات السوبرماركت نصف شهري", 780, "بطاقة دفع / فيزا (Debit)", "كارفور"),
    (12, "2026-11-16", "مواصلات وبنزين وصيانة سيارة", "تغيير زيت وفلتر للسيارة", 650, "تحويل بنكي / إنستاباي", "صيانة دورية"),
]

for idx, row in enumerate(sample_expenses, start=4):
    for c_idx, val in enumerate(row):
        col_char = col_letters[c_idx]
        cell = ws_daily[f"{col_char}{idx}"]
        cell.value = val
        cell.font = REGULAR_FONT
        cell.border = STANDARD_BORDER
        if idx % 2 == 1:
            cell.fill = ZEBRA_FILL
            
        if col_char == "A":
            cell.alignment = ALIGN_CENTER
        elif col_char == "B":
            cell.alignment = ALIGN_CENTER
        elif col_char == "C":
            cell.alignment = ALIGN_RIGHT
        elif col_char == "D":
            cell.alignment = ALIGN_RIGHT
        elif col_char == "E":
            cell.alignment = ALIGN_CENTER
            cell.number_format = CURRENCY_FORMAT
            cell.font = BOLD_FONT
        elif col_char == "F":
            cell.alignment = ALIGN_RIGHT
        elif col_char == "G":
            cell.alignment = ALIGN_RIGHT
    ws_daily.row_dimensions[idx].height = 22

# Add Total Row for Daily Expenses
total_daily_row = 4 + len(sample_expenses)
ws_daily[f"A{total_daily_row}"] = "المجموع الإجمالي للمصاريف"
ws_daily.merge_cells(f"A{total_daily_row}:D{total_daily_row}")
ws_daily[f"A{total_daily_row}"].fill = TOTAL_FILL
ws_daily[f"A{total_daily_row}"].font = BOLD_FONT
ws_daily[f"A{total_daily_row}"].alignment = Alignment(horizontal="center", vertical="center")
ws_daily[f"A{total_daily_row}"].border = TOTAL_BORDER

ws_daily[f"E{total_daily_row}"] = f"=SUM(E4:E{total_daily_row-1})"
ws_daily[f"E{total_daily_row}"].fill = TOTAL_FILL
ws_daily[f"E{total_daily_row}"].font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
ws_daily[f"E{total_daily_row}"].alignment = ALIGN_CENTER
ws_daily[f"E{total_daily_row}"].number_format = CURRENCY_FORMAT
ws_daily[f"E{total_daily_row}"].border = TOTAL_BORDER

ws_daily[f"F{total_daily_row}"].fill = TOTAL_FILL
ws_daily[f"F{total_daily_row}"].border = TOTAL_BORDER
ws_daily[f"G{total_daily_row}"].fill = TOTAL_FILL
ws_daily[f"G{total_daily_row}"].border = TOTAL_BORDER
ws_daily.row_dimensions[total_daily_row].height = 26

# Data Validation for Category in Daily Expenses (Column C)
cat_dv = DataValidation(type="list", formula1="'الإعدادات والتصنيفات'!$A$4:$A$11", allow_blank=True)
cat_dv.prompt = "يرجى اختيار فئة المصروف من القائمة"
cat_dv.promptTitle = "فئة المصروف"
ws_daily.add_data_validation(cat_dv)
cat_dv.add("C4:C500")

# Data Validation for Payment Method in Daily Expenses (Column F)
pay_dv = DataValidation(type="list", formula1="'الإعدادات والتصنيفات'!$E$4:$E$8", allow_blank=True)
pay_dv.prompt = "يرجى اختيار طريقة الدفع"
pay_dv.promptTitle = "طريقة الدفع"
ws_daily.add_data_validation(pay_dv)
pay_dv.add("F4:F500")

# -------------------------------------------------------------------------
# Sheet 3: الدخل والأقساط (Income & Commitments)
# -------------------------------------------------------------------------
ws_income = wb.create_sheet(title="الدخل والأقساط")
ws_income.sheet_view.rightToLeft = True

ws_income.merge_cells("A1:G1")
ws_income["A1"] = "💰 سجل مصادر الدخل الشهري"
ws_income["A1"].font = TITLE_FONT
ws_income["A1"].alignment = Alignment(horizontal="right", vertical="center")
ws_income.row_dimensions[1].height = 35

income_headers = ["م", "التاريخ", "مصدر الدخل", "المبلغ المتوقع", "المبلغ الفعلي المستلم", "طريقة الاستلام", "ملاحظات"]
income_cols = ["A", "B", "C", "D", "E", "F", "G"]

for col, h in zip(income_cols, income_headers):
    cell = ws_income[f"{col}3"]
    cell.value = h
    cell.fill = HEADER_FILL
    cell.font = WHITE_FONT
    cell.alignment = ALIGN_CENTER
    cell.border = STANDARD_BORDER
ws_income.row_dimensions[3].height = 26

sample_income = [
    (1, "2026-11-01", "الراتب الأساسي الشهري", 18000, 18000, "تحويل بنكي", "تم الإيداع بالحساب البنكي"),
    (2, "2026-11-10", "عمل حر / استشارات (Freelance)", 4500, 5000, "محفظة إلكترونية", "دفعة مشروع برمجة"),
    (3, "2026-11-15", "عائد استثمار / شهادات أو إيجار", 2000, 2000, "تحويل بنكي", "عائد شهري ثابت"),
    (4, "2026-11-20", "أرباح مبيعات جانبية", 1500, 0, "نقداً", "متوقع استلامها نهاية الشهر"),
]

for idx, row in enumerate(sample_income, start=4):
    for c_idx, val in enumerate(row):
        col_char = income_cols[c_idx]
        cell = ws_income[f"{col_char}{idx}"]
        cell.value = val
        cell.font = REGULAR_FONT
        cell.border = STANDARD_BORDER
        if col_char == "A" or col_char == "B":
            cell.alignment = ALIGN_CENTER
        elif col_char in ["D", "E"]:
            cell.alignment = ALIGN_CENTER
            cell.number_format = CURRENCY_FORMAT
            cell.font = BOLD_FONT
        else:
            cell.alignment = ALIGN_RIGHT
    ws_income.row_dimensions[idx].height = 22

income_tot_row = 4 + len(sample_income)
ws_income[f"A{income_tot_row}"] = "إجمالي الدخل الشهري"
ws_income.merge_cells(f"A{income_tot_row}:C{income_tot_row}")
ws_income[f"A{income_tot_row}"].fill = TOTAL_FILL
ws_income[f"A{income_tot_row}"].font = BOLD_FONT
ws_income[f"A{income_tot_row}"].alignment = ALIGN_CENTER
ws_income[f"A{income_tot_row}"].border = TOTAL_BORDER

ws_income[f"D{income_tot_row}"] = f"=SUM(D4:D{income_tot_row-1})"
ws_income[f"D{income_tot_row}"].fill = TOTAL_FILL
ws_income[f"D{income_tot_row}"].font = BOLD_FONT
ws_income[f"D{income_tot_row}"].alignment = ALIGN_CENTER
ws_income[f"D{income_tot_row}"].number_format = CURRENCY_FORMAT
ws_income[f"D{income_tot_row}"].border = TOTAL_BORDER

ws_income[f"E{income_tot_row}"] = f"=SUM(E4:E{income_tot_row-1})"
ws_income[f"E{income_tot_row}"].fill = TOTAL_FILL
ws_income[f"E{income_tot_row}"].font = Font(name="Calibri", size=12, bold=True, color="276A3C")
ws_income[f"E{income_tot_row}"].alignment = ALIGN_CENTER
ws_income[f"E{income_tot_row}"].number_format = CURRENCY_FORMAT
ws_income[f"E{income_tot_row}"].border = TOTAL_BORDER

ws_income[f"F{income_tot_row}"].fill = TOTAL_FILL
ws_income[f"F{income_tot_row}"].border = TOTAL_BORDER
ws_income[f"G{income_tot_row}"].fill = TOTAL_FILL
ws_income[f"G{income_tot_row}"].border = TOTAL_BORDER
ws_income.row_dimensions[income_tot_row].height = 26

# Commitments Table (Section 2)
commit_start_row = income_tot_row + 3
ws_income.merge_cells(f"A{commit_start_row}:I{commit_start_row}")
ws_income[f"A{commit_start_row}"] = "📅 جدول تتبع الأقساط والجمعيات الشهرية"
ws_income[f"A{commit_start_row}"].font = TITLE_FONT
ws_income[f"A{commit_start_row}"].alignment = Alignment(horizontal="right", vertical="center")
ws_income.row_dimensions[commit_start_row].height = 32

commit_headers = ["م", "البند / الالتزام", "القيمة الشهرية", "يوم الاستحقاق", "تاريخ البدء", "تاريخ الانتهاء", "الحالة (اختر)", "حالة الاستحقاق والتنبيه", "ملاحظات"]
commit_cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

h_row = commit_start_row + 1
for col, h in zip(commit_cols, commit_headers):
    cell = ws_income[f"{col}{h_row}"]
    cell.value = h
    cell.fill = TEAL_FILL
    cell.font = WHITE_FONT
    cell.alignment = ALIGN_CENTER
    cell.border = STANDARD_BORDER
ws_income.row_dimensions[h_row].height = 26

sample_commitments = [
    (1, "قسط تمويل شقة سكنية", 3200, 5, "2024-01-01", "2029-12-31", "تم الدفع", "خصم مباشر من البنك"),
    (2, "جمعية الأهل والأصدقاء (قبض شهر 4)", 2000, 10, "2026-01-01", "2026-10-31", "تم الدفع", "تحويل إنستاباي"),
    (3, "قسط سيارة", 1800, 18, "2025-06-01", "2028-05-31", "معلق / قيد الانتظار", "شيك بنكي"),
    (4, "قسط جهاز منزلي (B.TECH)", 450, 25, "2026-03-01", "2027-02-28", "معلق / قيد الانتظار", "سداد محفظة"),
    (5, "اشتراك نادي رياضي سنوي مقسط", 350, 28, "2026-01-01", "2026-12-31", "معلق / قيد الانتظار", "فيزا كاش"),
]

data_row_start = h_row + 1
for idx, item in enumerate(sample_commitments, start=data_row_start):
    num, title, val, due_day, start_d, end_d, status, notes = item
    ws_income[f"A{idx}"] = num
    ws_income[f"B{idx}"] = title
    ws_income[f"C{idx}"] = val
    ws_income[f"D{idx}"] = due_day
    ws_income[f"E{idx}"] = start_d
    ws_income[f"F{idx}"] = end_d
    ws_income[f"G{idx}"] = status
    # Formula for Alert:
    # IF(G = "تم الدفع", "✅ تم السداد", IF(DAY(TODAY()) > D, "🚨 متأخر السداد", IF(D - DAY(TODAY()) <= 3, "🔔 يستحق قريباً جداً", "⏳ مجدول")))
    ws_income[f"H{idx}"] = f'=IF(G{idx}="تم الدفع", "✅ تم السداد", IF(DAY(TODAY())>D{idx}, "🚨 متأخر السداد", IF(D{idx}-DAY(TODAY())<=3, "🔔 يستحق قريباً جداً", "⏳ مجدول")))'
    ws_income[f"I{idx}"] = notes
    
    for c in commit_cols:
        cell = ws_income[f"{c}{idx}"]
        cell.font = REGULAR_FONT
        cell.border = STANDARD_BORDER
        if c in ["A", "D", "E", "F", "G", "H"]:
            cell.alignment = ALIGN_CENTER
        elif c == "C":
            cell.alignment = ALIGN_CENTER
            cell.number_format = CURRENCY_FORMAT
            cell.font = BOLD_FONT
        else:
            cell.alignment = ALIGN_RIGHT
            
    ws_income.row_dimensions[idx].height = 22

commit_tot_row = data_row_start + len(sample_commitments)
ws_income[f"A{commit_tot_row}"] = "إجمالي الأقساط الشهرية"
ws_income.merge_cells(f"A{commit_tot_row}:B{commit_tot_row}")
ws_income[f"A{commit_tot_row}"].fill = TOTAL_FILL
ws_income[f"A{commit_tot_row}"].font = BOLD_FONT
ws_income[f"A{commit_tot_row}"].alignment = ALIGN_CENTER
ws_income[f"A{commit_tot_row}"].border = TOTAL_BORDER

ws_income[f"C{commit_tot_row}"] = f"=SUM(C{data_row_start}:C{commit_tot_row-1})"
ws_income[f"C{commit_tot_row}"].fill = TOTAL_FILL
ws_income[f"C{commit_tot_row}"].font = Font(name="Calibri", size=12, bold=True, color="C00000")
ws_income[f"C{commit_tot_row}"].alignment = ALIGN_CENTER
ws_income[f"C{commit_tot_row}"].number_format = CURRENCY_FORMAT
ws_income[f"C{commit_tot_row}"].border = TOTAL_BORDER

for c in ["D", "E", "F", "G", "H", "I"]:
    ws_income[f"{c}{commit_tot_row}"].fill = TOTAL_FILL
    ws_income[f"{c}{commit_tot_row}"].border = TOTAL_BORDER
ws_income.row_dimensions[commit_tot_row].height = 26

# Data Validation for Commitment Status (Column G)
status_dv = DataValidation(type="list", formula1="'الإعدادات والتصنيفات'!$G$4:$G$7", allow_blank=True)
status_dv.prompt = "يرجى اختيار حالة القسط"
status_dv.promptTitle = "حالة القسط"
ws_income.add_data_validation(status_dv)
status_dv.add(f"G{data_row_start}:G100")

# Conditional Formatting on Installments Status & Alerts
# 1. Paid -> Green
rule_paid = CellIsRule(operator='equal', formula=['"تم الدفع"'], fill=PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid"), font=Font(color="375623", bold=True))
ws_income.conditional_formatting.add(f"G{data_row_start}:G{commit_tot_row-1}", rule_paid)

# 2. Late alert -> Red
rule_late = CellIsRule(operator='equal', formula=['"🚨 متأخر السداد"'], fill=PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid"), font=Font(color="C65911", bold=True))
ws_income.conditional_formatting.add(f"H{data_row_start}:H{commit_tot_row-1}", rule_late)

# 3. Due soon -> Yellow
rule_due = CellIsRule(operator='equal', formula=['"🔔 يستحق قريباً جداً"'], fill=PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid"), font=Font(color="833C0C", bold=True))
ws_income.conditional_formatting.add(f"H{data_row_start}:H{commit_tot_row-1}", rule_due)


# -------------------------------------------------------------------------
# Sheet 1: لوحة التحكم (Dashboard)
# -------------------------------------------------------------------------
ws_dash = wb.create_sheet(title="لوحة التحكم", index=0)
ws_dash.sheet_view.rightToLeft = True

ws_dash.merge_cells("A1:G1")
ws_dash["A1"] = "📊 لوحة التحكم والمؤشرات المالية للميزانية الشهرية"
ws_dash["A1"].font = TITLE_FONT
ws_dash["A1"].alignment = Alignment(horizontal="right", vertical="center")
ws_dash.row_dimensions[1].height = 40

# --- KPI CARDS (Rows 3 to 5) ---
cards = [
    # (Title, Formula, ColStart, ColEnd, ValueFont, Format)
    ("💵 إجمالي الدخل الفعلي", f"='الدخل والأقساط'!E{income_tot_row}", "A", "B", GREEN_VALUE_FONT, CURRENCY_FORMAT),
    ("💳 إجمالي الأقساط والجمعيات", f"='الدخل والأقساط'!C{commit_tot_row}", "C", "C", Font(name="Calibri", size=16, bold=True, color="C00000"), CURRENCY_FORMAT),
    ("🛒 إجمالي المصاريف اليومية", f"='المصاريف اليومية'!E{total_daily_row}", "D", "E", Font(name="Calibri", size=16, bold=True, color="B28900"), CURRENCY_FORMAT),
    ("💎 صافي السيولة المتبقية", "=A4-(C4+D4)", "F", "F", Font(name="Calibri", size=18, bold=True, color="1F4E79"), CURRENCY_FORMAT),
    ("📈 معدل التوفير", "=IF(A4>0, F4/A4, 0)", "G", "G", Font(name="Calibri", size=18, bold=True, color="276A3C"), PERCENT_FORMAT),
]

ws_dash.row_dimensions[3].height = 22
ws_dash.row_dimensions[4].height = 36
ws_dash.row_dimensions[5].height = 10

for title, formula, cs, ce, vfont, fmt in cards:
    # Header of card
    if cs != ce:
        ws_dash.merge_cells(f"{cs}3:{ce}3")
    header_cell = ws_dash[f"{cs}3"]
    header_cell.value = title
    header_cell.font = CARD_TITLE_FONT
    header_cell.alignment = ALIGN_CENTER
    header_cell.fill = CARD_FILL
    header_cell.border = CARD_BORDER
    
    # Value of card
    if cs != ce:
        ws_dash.merge_cells(f"{cs}4:{ce}4")
    val_cell = ws_dash[f"{cs}4"]
    val_cell.value = formula
    val_cell.font = vfont
    val_cell.alignment = ALIGN_CENTER
    val_cell.fill = CARD_FILL
    val_cell.border = CARD_BORDER
    val_cell.number_format = fmt

# --- SECTION 2: Budget vs Actual Table ---
sec_row = 7
ws_dash.merge_cells(f"A{sec_row}:G{sec_row}")
ws_dash[f"A{sec_row}"] = "🎯 تحليل ومتابعة الميزانية التقديرية مقابل المصروف الفعلي (Budget vs Actual)"
ws_dash[f"A{sec_row}"].font = SECTION_FONT
ws_dash[f"A{sec_row}"].alignment = Alignment(horizontal="right", vertical="center")
ws_dash.row_dimensions[sec_row].height = 30

dash_headers = ["فئة المصروف", "الميزانية المحددة", "الفعلي المصروف", "المبلغ المتبقي", "نسبة الاستهلاك", "حالة الميزانية", "المؤشر البصري"]
dash_cols = ["A", "B", "C", "D", "E", "F", "G"]

dh_row = sec_row + 1
for col, h in zip(dash_cols, dash_headers):
    cell = ws_dash[f"{col}{dh_row}"]
    cell.value = h
    cell.fill = HEADER_FILL
    cell.font = WHITE_FONT
    cell.alignment = ALIGN_CENTER
    cell.border = STANDARD_BORDER
ws_dash.row_dimensions[dh_row].height = 28

# Populate Categories in Dashboard Table
dash_data_start = dh_row + 1
num_cats = len(categories_data)
for idx in range(num_cats):
    curr_r = dash_data_start + idx
    settings_r = 4 + idx
    
    # Column A: Category Name
    ws_dash[f"A{curr_r}"] = f"='الإعدادات والتصنيفات'!A{settings_r}"
    ws_dash[f"A{curr_r}"].alignment = ALIGN_RIGHT
    ws_dash[f"A{curr_r}"].font = BOLD_FONT
    
    # Column B: Budgeted Amount
    ws_dash[f"B{curr_r}"] = f"='الإعدادات والتصنيفات'!B{settings_r}"
    ws_dash[f"B{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"B{curr_r}"].font = BOLD_FONT
    ws_dash[f"B{curr_r}"].number_format = CURRENCY_FORMAT
    
    # Column C: Actual Spent (SUMIF from Daily Expenses)
    ws_dash[f"C{curr_r}"] = f"=SUMIF('المصاريف اليومية'!$C$4:$C$500, A{curr_r}, 'المصاريف اليومية'!$E$4:$E$500)"
    ws_dash[f"C{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"C{curr_r}"].font = BOLD_FONT
    ws_dash[f"C{curr_r}"].number_format = CURRENCY_FORMAT
    
    # Column D: Remaining (Budget - Actual)
    ws_dash[f"D{curr_r}"] = f"=B{curr_r}-C{curr_r}"
    ws_dash[f"D{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"D{curr_r}"].font = BOLD_FONT
    ws_dash[f"D{curr_r}"].number_format = CURRENCY_FORMAT
    
    # Column E: Consumption % (Actual / Budget)
    ws_dash[f"E{curr_r}"] = f"=IF(B{curr_r}>0, C{curr_r}/B{curr_r}, 0)"
    ws_dash[f"E{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"E{curr_r}"].font = BOLD_FONT
    ws_dash[f"E{curr_r}"].number_format = PERCENT_FORMAT
    
    # Column F: Status
    ws_dash[f"F{curr_r}"] = f'=IF(C{curr_r}>B{curr_r}, "🚨 تخطى الميزانية", IF(C{curr_r}>=B{curr_r}*0.85, "⚠️ اقترب من الحد الأقصى", "✅ ضمن الحدود الآمنة"))'
    ws_dash[f"F{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"F{curr_r}"].font = BOLD_FONT
    
    # Column G: Visual Indicator
    ws_dash[f"G{curr_r}"] = f'=IF(C{curr_r}>B{curr_r}, "⛔ خطر", IF(C{curr_r}>=B{curr_r}*0.85, "🟡 انتباه", "🟢 ممتاز"))'
    ws_dash[f"G{curr_r}"].alignment = ALIGN_CENTER
    ws_dash[f"G{curr_r}"].font = BOLD_FONT

    for col in dash_cols:
        cell = ws_dash[f"{col}{curr_r}"]
        cell.border = STANDARD_BORDER
        if idx % 2 == 1:
            cell.fill = ZEBRA_FILL
    ws_dash.row_dimensions[curr_r].height = 24

# Total Row for Dashboard Table
dash_tot_row = dash_data_start + num_cats
ws_dash[f"A{dash_tot_row}"] = "المجموع الإجمالي للميزانية"
ws_dash[f"A{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"A{dash_tot_row}"].font = BOLD_FONT
ws_dash[f"A{dash_tot_row}"].alignment = ALIGN_CENTER
ws_dash[f"A{dash_tot_row}"].border = TOTAL_BORDER

ws_dash[f"B{dash_tot_row}"] = f"=SUM(B{dash_data_start}:B{dash_tot_row-1})"
ws_dash[f"B{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"B{dash_tot_row}"].font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
ws_dash[f"B{dash_tot_row}"].alignment = ALIGN_CENTER
ws_dash[f"B{dash_tot_row}"].number_format = CURRENCY_FORMAT
ws_dash[f"B{dash_tot_row}"].border = TOTAL_BORDER

ws_dash[f"C{dash_tot_row}"] = f"=SUM(C{dash_data_start}:C{dash_tot_row-1})"
ws_dash[f"C{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"C{dash_tot_row}"].font = Font(name="Calibri", size=12, bold=True, color="B28900")
ws_dash[f"C{dash_tot_row}"].alignment = ALIGN_CENTER
ws_dash[f"C{dash_tot_row}"].number_format = CURRENCY_FORMAT
ws_dash[f"C{dash_tot_row}"].border = TOTAL_BORDER

ws_dash[f"D{dash_tot_row}"] = f"=B{dash_tot_row}-C{dash_tot_row}"
ws_dash[f"D{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"D{dash_tot_row}"].font = Font(name="Calibri", size=12, bold=True, color="1F4E79")
ws_dash[f"D{dash_tot_row}"].alignment = ALIGN_CENTER
ws_dash[f"D{dash_tot_row}"].number_format = CURRENCY_FORMAT
ws_dash[f"D{dash_tot_row}"].border = TOTAL_BORDER

ws_dash[f"E{dash_tot_row}"] = f"=IF(B{dash_tot_row}>0, C{dash_tot_row}/B{dash_tot_row}, 0)"
ws_dash[f"E{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"E{dash_tot_row}"].font = BOLD_FONT
ws_dash[f"E{dash_tot_row}"].alignment = ALIGN_CENTER
ws_dash[f"E{dash_tot_row}"].number_format = PERCENT_FORMAT
ws_dash[f"E{dash_tot_row}"].border = TOTAL_BORDER

ws_dash[f"F{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"F{dash_tot_row}"].border = TOTAL_BORDER
ws_dash[f"G{dash_tot_row}"].fill = TOTAL_FILL
ws_dash[f"G{dash_tot_row}"].border = TOTAL_BORDER
ws_dash.row_dimensions[dash_tot_row].height = 28

# -------------------------------------------------------------------------
# CONDITIONAL FORMATTING (Dashboard)
# -------------------------------------------------------------------------
# 1. Red highlighting when Actual > Budget on rows (C to G)
rule_budget_exceeded = FormulaRule(
    formula=[f"$C{dash_data_start}>$B{dash_data_start}"],
    fill=PatternFill(start_color="FFD9D9", end_color="FFD9D9", fill_type="solid"),
    font=Font(color="900C3F", bold=True)
)
ws_dash.conditional_formatting.add(f"C{dash_data_start}:G{dash_tot_row-1}", rule_budget_exceeded)

# 2. Yellow highlighting when Actual >= 85% of Budget and <= Budget
rule_warning = FormulaRule(
    formula=[f"AND($C{dash_data_start}>=($B{dash_data_start}*0.85), $C{dash_data_start}<=$B{dash_data_start})"],
    fill=PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid"),
    font=Font(color="833C0C", bold=True)
)
ws_dash.conditional_formatting.add(f"C{dash_data_start}:G{dash_tot_row-1}", rule_warning)

# 3. Red highlighting if Remaining in D < 0
rule_negative_rem = CellIsRule(
    operator='lessThan',
    formula=['0'],
    fill=PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid"),
    font=Font(color="9C0006", bold=True)
)
ws_dash.conditional_formatting.add(f"D{dash_data_start}:D{dash_tot_row}", rule_negative_rem)

# -------------------------------------------------------------------------
# ADJUST COLUMN WIDTHS FOR ALL SHEETS
# -------------------------------------------------------------------------
for ws in [ws_dash, ws_daily, ws_income, ws_settings]:
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Skip merged title row in width calculation
            if cell.row == 1:
                continue
            if cell.value:
                val_str = str(cell.value)
                # Arabic characters approximate visual width
                max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = max(max_len + 5, 14)

# Specific custom tweaks for dashboard widths
ws_dash.column_dimensions["A"].width = 30
ws_dash.column_dimensions["B"].width = 20
ws_dash.column_dimensions["C"].width = 20
ws_dash.column_dimensions["D"].width = 20
ws_dash.column_dimensions["E"].width = 16
ws_dash.column_dimensions["F"].width = 24
ws_dash.column_dimensions["G"].width = 16

# Daily sheet widths
ws_daily.column_dimensions["A"].width = 8
ws_daily.column_dimensions["B"].width = 14
ws_daily.column_dimensions["C"].width = 30
ws_daily.column_dimensions["D"].width = 32
ws_daily.column_dimensions["E"].width = 16
ws_daily.column_dimensions["F"].width = 26
ws_daily.column_dimensions["G"].width = 24

# Income sheet widths
ws_income.column_dimensions["A"].width = 8
ws_income.column_dimensions["B"].width = 28
ws_income.column_dimensions["C"].width = 18
ws_income.column_dimensions["D"].width = 16
ws_income.column_dimensions["E"].width = 16
ws_income.column_dimensions["F"].width = 16
ws_income.column_dimensions["G"].width = 22
ws_income.column_dimensions["H"].width = 24
ws_income.column_dimensions["I"].width = 24

# Settings sheet widths
ws_settings.column_dimensions["A"].width = 32
ws_settings.column_dimensions["B"].width = 26
ws_settings.column_dimensions["C"].width = 45
ws_settings.column_dimensions["D"].width = 8
ws_settings.column_dimensions["E"].width = 28
ws_settings.column_dimensions["F"].width = 8
ws_settings.column_dimensions["G"].width = 24

# Save workbook
output_filename = "قالب_الميزانية_الشخصية_والمنزلية_الاحترافي.xlsx"
wb.save(output_filename)
print(f"Workbook successfully created and saved as: {output_filename}")
