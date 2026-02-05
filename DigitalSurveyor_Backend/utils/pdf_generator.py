# utils/pdf_generator.py
from fpdf import FPDF
import os
from datetime import datetime


class DamagePDF(FPDF):
    """Custom PDF class for Digital Surveyor damage reports."""
    
    def header(self):
        """Page header with branding."""
        self.set_font('Arial', 'B', 16)
        self.set_text_color(30, 58, 138)  # Blue
        self.cell(0, 10, 'Digital Surveyor - Damage Assessment Report', align='C', ln=True)
        self.ln(5)
    
    def footer(self):
        """Page footer with page number."""
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')


def create_damage_report(scan_data: dict, output_path: str) -> bool:
    """
    Generate a branded PDF report for the damage assessment.
    
    Args:
        scan_data: Dictionary containing:
            - car_name: str
            - user_id: str
            - damages: list of damage dicts
            - total_estimate: float
            - currency: str
            - original_image_path: str (optional, local path)
            - processed_image_path: str (optional, local path)
        output_path: Where to save the PDF
    
    Returns:
        bool: True if successful
    """
    try:
        pdf = DamagePDF()
        pdf.add_page()
        
        # === VEHICLE INFORMATION ===
        pdf.set_font('Arial', 'B', 14)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 10, 'Vehicle Information', ln=True)
        pdf.ln(2)
        
        pdf.set_font('Arial', '', 11)
        pdf.cell(0, 8, f"Vehicle: {scan_data.get('car_name', 'Unknown')}",ln=True)
        pdf.cell(0, 8, f"Scan Date: {datetime.now().strftime('%B %d, %Y at %H:%M')}",  ln=True)
        pdf.cell(0, 8, f"Report ID: {scan_data.get('scan_id', 'N/A')[:8]}...", ln=True)
        pdf.ln(5)
        
        # === IMAGES (if local paths available) ===
        if scan_data.get('original_image_path') and os.path.exists(scan_data['original_image_path']):
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 10, 'Original Image', ln=True)
            try:
                pdf.image(scan_data['original_image_path'], x=10, w=90)
                pdf.ln(5)
            except Exception as e:
                print(f"Could not embed original image: {e}")
        
        if scan_data.get('processed_image_path') and os.path.exists(scan_data['processed_image_path']):
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 10, 'AI Detection Results', ln=True)
            try:
                pdf.image(scan_data['processed_image_path'], x=10, w=90)
                pdf.ln(5)
            except Exception as e:
                print(f"Could not embed processed image: {e}")
        
        # === DAMAGE BREAKDOWN TABLE ===
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Damage Breakdown', ln=True)
        pdf.ln(3)
        
        # Table Header
        pdf.set_font('Arial', 'B', 10)
        pdf.set_fill_color(30, 58, 138)  # Blue background
        pdf.set_text_color(255, 255, 255)  # White text
        
        col_widths = [40, 35, 25, 50, 30]
        headers = ['Part', 'Damage Type', 'Severity', 'Recommended Action', 'Cost']
        
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align='C', fill=True)
        pdf.ln()
        
        # Table Rows
        pdf.set_font('Arial', '', 9)
        pdf.set_text_color(0, 0, 0)
        
        damages = scan_data.get('damages', [])
        currency_symbol = 'Rs.' if scan_data.get('currency') == 'INR' else '$'
        
        for damage in damages:
            pdf.cell(col_widths[0], 8, damage.get('part', 'Unknown'), border=1)
            pdf.cell(col_widths[1], 8, damage.get('type', 'Unknown'), border=1)
            pdf.cell(col_widths[2], 8, f"{damage.get('severity', 0)}/100", border=1, align='C')
            pdf.cell(col_widths[3], 8, damage.get('action', 'Repair')[:20], border=1)
            pdf.cell(col_widths[4], 8, f"{currency_symbol}{damage.get('cost', 0):,.0f}", border=1, align='R')
            pdf.ln()
        
        # Total Cost
        pdf.ln(5)
        pdf.set_font('Arial', 'B', 12)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(sum(col_widths[:4]), 10, 'TOTAL ESTIMATED COST:', border=1, fill=True)
        pdf.set_text_color(220, 38, 38)  # Red for emphasis
        pdf.cell(col_widths[4], 10, f"{currency_symbol}{scan_data.get('total_estimate', 0):,.0f}", 
                 border=1, align='R', fill=True)
        pdf.ln(10)
        
        # === FOOTER NOTE ===
        pdf.set_font('Arial', 'I', 9)
        pdf.set_text_color(100, 100, 100)
        pdf.multi_cell(0, 5, 
            "Note: This is an AI-generated estimate. Actual repair costs may vary based on "
            "location, parts availability, and labor rates. Please consult a certified mechanic "
            "for a final quote."
        )
        
        # Save PDF
        pdf.output(output_path)
        print(f"✅ PDF generated: {output_path}")
        return True
        
    except Exception as e:
        print(f"⚠️ PDF generation error: {e}")
        return False
