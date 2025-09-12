/**
 * QR Code Service for Fataplus Mobile App
 * Handles QR code generation and scanning for peer-to-peer LLM sharing
 */

import QRCode from 'react-native-qrcode-svg';

export interface ConnectionInfo {
  hostId: string;
  ipAddress: string;
  port: number;
  modelName: string;
  timestamp: number;
}

class QRService {
  /**
   * Generate QR code for local LLM hosting
   * @param hostId Unique identifier for the host
   * @param ipAddress IP address of the host
   * @param port Port number for the LLM service
   * @param modelName Name of the LLM model
   */
  generateHostingQRCode(
    hostId: string,
    ipAddress: string,
    port: number,
    modelName: string
  ): string {
    const connectionInfo: ConnectionInfo = {
      hostId,
      ipAddress,
      port,
      modelName,
      timestamp: Date.now(),
    };

    // Encode connection info as JSON and create a deep link
    const encodedInfo = encodeURIComponent(JSON.stringify(connectionInfo));
    return `fataplus://connect/${encodedInfo}`;
  }

  /**
   * Parse QR code data to extract connection information
   * @param qrData QR code data string
   */
  parseConnectionQRCode(qrData: string): ConnectionInfo | null {
    try {
      // Check if it's a Fataplus connection QR code
      if (qrData.startsWith('fataplus://connect/')) {
        const encodedInfo = qrData.replace('fataplus://connect/', '');
        const decodedInfo = decodeURIComponent(encodedInfo);
        const connectionInfo: ConnectionInfo = JSON.parse(decodedInfo);
        
        // Validate required fields
        if (connectionInfo.hostId && connectionInfo.ipAddress && connectionInfo.port) {
          return connectionInfo;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to parse QR code:', error);
      return null;
    }
  }

  /**
   * Generate QR code component for React Native
   * @param data Data to encode in QR code
   * @param size Size of the QR code
   */
  generateQRCodeComponent(data: string, size: number = 200): JSX.Element {
    return <QRCode value={data} size={size} />;
  }

  /**
   * Validate connection info is still fresh (not older than 5 minutes)
   * @param connectionInfo Connection information
   */
  isConnectionInfoFresh(connectionInfo: ConnectionInfo): boolean {
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (Date.now() - connectionInfo.timestamp) < fiveMinutes;
  }
}

// Export singleton instance
export const qrService = new QRService();