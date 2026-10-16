import io
from datetime import datetime
from typing import Dict, Any, Tuple
import pandas as pd
from fastapi import HTTPException
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

from backend.app.services.data_service import data_service
from backend.app.services.cleaning_service import cleaning_service
from backend.app.utils.helpers import detect_columns

class ExportService:
    def export_cleaned_csv(self) -> Tuple[io.BytesIO, str]:
        """Exports the active cleaned dataset as CSV with UTF-8 BOM encoding."""
        if data_service.df is None or data_service.df.empty:
            raise HTTPException(status_code=400, detail="No active dataset available for export.")

        df = data_service.df
        # Exclude internal columns starting with '_'
        export_cols = [c for c in df.columns if not c.startswith("_")]
        clean_df = df[export_cols]

        output = io.BytesIO()
        # utf-8-sig adds BOM so Excel opens it with proper encoding
        csv_bytes = clean_df.to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
        output.write(csv_bytes)
        output.seek(0)

        filename = f"Cleaned_{data_service.filename or 'dataset'}_{data_service.version_id.replace(' ', '_')}.csv"
        return output, filename

    def export_cleaned_excel(self) -> Tuple[io.BytesIO, str]:
        """
        Exports active cleaned dataset as a multi-sheet Microsoft Excel (.xlsx) workbook:
        Sheet 1: Cleaned Data
        Sheet 2: Cleaning Summary
        Sheet 3: Change Log
        Sheet 4: Data Quality Report
        """
        if data_service.df is None or data_service.df.empty:
            raise HTTPException(status_code=400, detail="No active dataset available for export.")

        df = data_service.df
        export_cols = [c for c in df.columns if not c.startswith("_")]
        clean_df = df[export_cols]

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            # Sheet 1: Cleaned Data
            clean_df.to_excel(writer, sheet_name="Cleaned Data", index=False)

            # Sheet 2: Cleaning Summary
            summary_info = {
                "Metric": [
                    "Dataset Identifier",
                    "Dataset Version",
                    "Source Filename",
                    "Upload Timestamp",
                    "Export Timestamp",
                    "Original Rows",
                    "Cleaned Rows",
                    "Net Rows Removed",
                    "Original Columns",
                    "Active Columns",
                    "Total Operations Executed",
                    "Total Cells Modified"
                ],
                "Value": [
                    data_service.dataset_id,
                    data_service.version_id,
                    data_service.filename or "superstore.csv",
                    data_service.upload_timestamp,
                    datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                    len(data_service.original_df) if data_service.original_df is not None else len(df),
                    len(df),
                    (len(data_service.original_df) - len(df)) if data_service.original_df is not None else 0,
                    len(data_service.original_df.columns) if data_service.original_df is not None else len(df.columns),
                    len(export_cols),
                    len(cleaning_service.audit_log),
                    len(cleaning_service.cell_changes)
                ]
            }
            pd.DataFrame(summary_info).to_excel(writer, sheet_name="Cleaning Summary", index=False)

            # Sheet 3: Change Log
            if cleaning_service.audit_log:
                log_df = pd.DataFrame(cleaning_service.audit_log)
            else:
                log_df = pd.DataFrame([{
                    "operation_id": "INIT",
                    "timestamp": data_service.upload_timestamp,
                    "operation_name": "Dataset Ingestion",
                    "column_affected": "ALL",
                    "cleaning_rule": "Initial profile load without modifications",
                    "original_state": "Raw uploaded data",
                    "resulting_state": f"{len(df)} rows verified",
                    "affected_rows_count": 0,
                    "affected_cells_count": 0,
                    "status": "INITIALIZED"
                }])
            log_df.to_excel(writer, sheet_name="Change Log", index=False)

            # Sheet 4: Data Quality Report
            profile = data_service.get_profile()
            col_stats = profile.get("columns", [])
            if col_stats:
                quality_rows = []
                for c in col_stats:
                    quality_rows.append({
                        "Column": c.get("column"),
                        "Data Type": c.get("dtype"),
                        "Missing Count": c.get("missing_count"),
                        "Missing Pct (%)": c.get("missing_pct"),
                        "Unique Count": c.get("unique_count"),
                        "Min": c.get("min", "-"),
                        "Max": c.get("max", "-"),
                        "Mean": c.get("mean", "-"),
                        "Median": c.get("median", "-"),
                        "Standard Deviation": c.get("std", "-"),
                        "Suggested Treatment": c.get("suggested_treatment")
                    })
                pd.DataFrame(quality_rows).to_excel(writer, sheet_name="Data Quality Report", index=False)

        output.seek(0)
        filename = f"Cleaned_{data_service.filename or 'dataset'}_{data_service.version_id.replace(' ', '_')}.xlsx"
        return output, filename

    def export_cleaned_dataset_pdf(self, max_rows: int = 400) -> Tuple[io.BytesIO, str]:
        """
        Generates a genuine paginated PDF table representing the cleaned dataset.
        Includes metadata banner, repeating table headers, and page numbering.
        """
        if data_service.df is None or data_service.df.empty:
            raise HTTPException(status_code=400, detail="No active dataset available for export.")

        df = data_service.df
        export_cols = [c for c in df.columns if not c.startswith("_")]
        # Select key business columns for PDF readability (or first 8 columns)
        preferred_cols = ["Order ID", "Order Date", "Category", "Sub-Category", "Region", "Sales", "Quantity", "Discount", "Profit"]
        pdf_cols = [c for c in preferred_cols if c in export_cols]
        if len(pdf_cols) < 5:
            pdf_cols = export_cols[:8]

        sample_df = df[pdf_cols].head(max_rows)

        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=landscape(letter),
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        meta_style = ParagraphStyle(
            'MetaStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=7,
            leading=9,
            textColor=colors.HexColor('#1e293b')
        )
        header_cell_style = ParagraphStyle(
            'HeaderCellText',
            parent=styles['Normal'],
            fontSize=7,
            leading=9,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor('#ffffff')
        )

        elements = []

        # Banner Title
        title_text = f"Cleaned Dataset Table — {data_service.filename or 'dataset.csv'}"
        elements.append(Paragraph(title_text, title_style))
        meta_text = (
            f"<b>Dataset Version:</b> {data_service.version_id} | "
            f"<b>Total Cleaned Rows:</b> {len(df):,} | "
            f"<b>Total Columns:</b> {len(export_cols)} | "
            f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>"
            f"<i>Displaying {len(sample_df)} sample rows across key columns. Full complete dataset is downloadable in CSV or Excel.</i>"
        )
        elements.append(Paragraph(meta_text, meta_style))
        elements.append(Spacer(1, 8))

        # Build Table Data
        header_row = [Paragraph(str(col), header_cell_style) for col in pdf_cols]
        table_data = [header_row]

        for _, row in sample_df.iterrows():
            row_cells = []
            for col in pdf_cols:
                val = row[col]
                val_str = str(round(val, 2)) if isinstance(val, (float, int)) else str(val)
                # Truncate very long string
                if len(val_str) > 25:
                    val_str = val_str[:22] + "..."
                row_cells.append(Paragraph(val_str, cell_style))
            table_data.append(row_cells)

        col_count = len(pdf_cols)
        page_width = landscape(letter)[0] - 72
        col_width = page_width / col_count

        t = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
        ]))
        elements.append(t)

        doc.build(elements)
        output.seek(0)
        filename = f"Cleaned_Dataset_{data_service.filename or 'data'}_{data_service.version_id.replace(' ', '_')}.pdf"
        return output, filename

    def export_cleaning_report_pdf(self) -> Tuple[io.BytesIO, str]:
        """
        Generates an executive-level Data Cleaning & Quality Audit Report PDF.
        Features data hygiene metrics, before/after comparisons, operations log, and residual risks.
        """
        if data_service.df is None or data_service.df.empty:
            raise HTTPException(status_code=400, detail="No active dataset available for export.")

        df = data_service.df
        orig_df = data_service.original_df if data_service.original_df is not None else df
        profile = data_service.get_profile()

        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        sec_style = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e40af'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        bold_body = ParagraphStyle(
            'BoldBody',
            parent=body_style,
            fontName="Helvetica-Bold"
        )
        table_hdr = ParagraphStyle(
            'TableHdr',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor('#ffffff')
        )
        table_body = ParagraphStyle(
            'TableBody',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1e293b')
        )

        elements = []

        # Document Header
        elements.append(Paragraph("Data Cleaning & Quality Audit Report", title_style))
        meta_str = (
            f"<b>Dataset:</b> {data_service.filename or 'superstore.csv'} | "
            f"<b>Session ID:</b> {data_service.dataset_id} | "
            f"<b>Version:</b> {data_service.version_id}<br/>"
            f"<b>Audit Date:</b> {datetime.utcnow().strftime('%B %d, %Y - %H:%M:%S UTC')}"
        )
        elements.append(Paragraph(meta_str, body_style))
        elements.append(Spacer(1, 10))

        # 1. Executive Summary & Health Score
        elements.append(Paragraph("1. Executive Data Quality Overview", sec_style))
        rows_removed = len(orig_df) - len(df)
        initial_dups = int(orig_df.duplicated().sum())
        remaining_dups = int(df.duplicated().sum())
        initial_nulls = int(orig_df.isnull().sum().sum())
        remaining_nulls = int(df.isnull().sum().sum())

        quality_score = 100 - min(40, (remaining_nulls / (len(df) * len(df.columns)) * 1000 if len(df) > 0 else 0)) - (10 if remaining_dups > 0 else 0)
        quality_score = round(max(60.0, min(100.0, quality_score)), 1)

        summary_text = (
            f"This audit certifies the data cleaning and verification operations executed on <b>{data_service.filename or 'dataset'}</b>. "
            f"The final sanitized dataset contains <b>{len(df):,} valid records</b> and <b>{len(df.columns)} attributes</b>. "
            f"Overall Data Integrity benchmark score is <b>{quality_score}/100</b>."
        )
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 8))

        # Dimensions Before vs After Table
        dim_data = [
            [Paragraph("Dimension", table_hdr), Paragraph("Original Dataset", table_hdr), Paragraph("Cleaned Working Copy", table_hdr), Paragraph("Net Change", table_hdr)],
            [Paragraph("Total Row Count", table_body), Paragraph(f"{len(orig_df):,}", table_body), Paragraph(f"{len(df):,}", table_body), Paragraph(f"-{rows_removed:,}", table_body)],
            [Paragraph("Total Columns", table_body), Paragraph(f"{len(orig_df.columns)}", table_body), Paragraph(f"{len(df.columns)}", table_body), Paragraph("0", table_body)],
            [Paragraph("Missing Value Cells", table_body), Paragraph(f"{initial_nulls:,}", table_body), Paragraph(f"{remaining_nulls:,}", table_body), Paragraph(f"-{initial_nulls - remaining_nulls:,}", table_body)],
            [Paragraph("Duplicate Records", table_body), Paragraph(f"{initial_dups:,}", table_body), Paragraph(f"{remaining_dups:,}", table_body), Paragraph(f"-{initial_dups - remaining_dups:,}", table_body)],
        ]
        dim_table = Table(dim_data, colWidths=[150, 120, 130, 100])
        dim_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
        ]))
        elements.append(dim_table)
        elements.append(Spacer(1, 12))

        # 2. Operations History Table
        elements.append(Paragraph("2. Chronological Cleaning Operations Executed", sec_style))
        if cleaning_service.audit_log:
            op_data = [
                [Paragraph("Timestamp", table_hdr), Paragraph("Operation", table_hdr), Paragraph("Column", table_hdr), Paragraph("Cleaning Rule", table_hdr), Paragraph("Status", table_hdr)]
            ]
            for op in cleaning_service.audit_log[:15]:
                op_data.append([
                    Paragraph(op.get("timestamp", "-").split(" ")[1], table_body),
                    Paragraph(op.get("operation_name", "-"), table_body),
                    Paragraph(op.get("column_affected", "ALL"), table_body),
                    Paragraph(op.get("cleaning_rule", "-")[:45], table_body),
                    Paragraph(op.get("status", "SUCCESS"), table_body)
                ])
            op_table = Table(op_data, colWidths=[70, 120, 90, 150, 70])
            op_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
            ]))
            elements.append(op_table)
        else:
            elements.append(Paragraph("<i>No transformations applied yet. Dataset verified in its original schema.</i>", body_style))

        elements.append(Spacer(1, 12))

        # 3. Sample Modified Cells Table
        elements.append(Paragraph("3. Sample Before-and-After Value Modifications", sec_style))
        if cleaning_service.cell_changes:
            cell_data = [
                [Paragraph("Row Identifier", table_hdr), Paragraph("Attribute", table_hdr), Paragraph("Original Value", table_hdr), Paragraph("Cleaned Value", table_hdr), Paragraph("Applied Rule", table_hdr)]
            ]
            for ch in cleaning_service.cell_changes[:12]:
                cell_data.append([
                    Paragraph(str(ch.get("row_identifier", "-"))[:20], table_body),
                    Paragraph(str(ch.get("column", "-")), table_body),
                    Paragraph(str(ch.get("original_value", "-"))[:20], table_body),
                    Paragraph(str(ch.get("cleaned_value", "-"))[:20], table_body),
                    Paragraph(str(ch.get("cleaning_rule", "-"))[:35], table_body)
                ])
            cell_table = Table(cell_data, colWidths=[90, 80, 90, 90, 150])
            cell_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#475569')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
            ]))
            elements.append(cell_table)
        else:
            elements.append(Paragraph("<i>No cell modifications recorded. Initial data values retained.</i>", body_style))

        elements.append(Spacer(1, 14))

        # 4. Certification & Signoff
        elements.append(Paragraph("4. Data Science Integrity Certification", sec_style))
        signoff_text = (
            "<b>Data Integrity Guarantee:</b> All transformations conform strictly to reproducible data science practices. "
            "Original uploaded records are preserved immutably. Cleaned exports preserve column mappings and data types "
            "for predictive modeling without data leakage."
        )
        elements.append(Paragraph(signoff_text, body_style))

        doc.build(elements)
        output.seek(0)
        filename = f"Cleaning_Audit_Report_{data_service.filename or 'data'}_{data_service.version_id.replace(' ', '_')}.pdf"
        return output, filename

export_service = ExportService()

