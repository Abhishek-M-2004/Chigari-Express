const QRCode = require('qrcode');

class TicketQRGenerator {
  static async generateQRCode(ticketData) {
    try {
      // Create structured QR data
      const qrData = {
        ticketId: ticketData.ticketId,
        from: ticketData.from,
        to: ticketData.to,
        validTill: ticketData.validTill,
        type: "bus_ticket",
        version: "1.0",
        timestamp: Date.now()
      };

      // Convert to JSON string
      const qrString = JSON.stringify(qrData);
      
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 400,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrData: qrString,
        qrDataURL,
        base64: Buffer.from(qrString).toString('base64')
      };
    } catch (error) {
      console.error("QR Generation Error:", error);
      throw error;
    }
  }

  static parseQRData(qrString) {
    try {
      return JSON.parse(qrString);
    } catch (error) {
      throw new Error("Invalid QR code data");
    }
  }
}

module.exports = TicketQRGenerator;