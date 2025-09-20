import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PDFTemplate from '../components/ui/PDFTemplate';

// Re-export PDFData interface
export interface PDFData {
  selectedServices: Array<{
    id: string;
    name: string;
    description: string;
    days: number;
    costEUR: number;
    costMGA: number;
    complexity: string;
    sdg: string;
    aiReasoning?: string;
  }>;
  agencyTotalEUR: number;
  agencyTotalMGA: number;
  saasUsers: number;
  saasMonths: number;
  saasTotalEUR: number;
  saasTotalMGA: number;
  grandTotalEUR: number;
  grandTotalMGA: number;
  includeSaaS: boolean;
  currency: 'EUR' | 'MGA';
  agencyTotalDays: number;
  originalPrompt?: string;
}

/**
 * Génère un PDF avec les données d'estimation de prix
 */
export const generatePriceEstimatePDF = async (data: PDFData): Promise<Blob> => {
  try {
    const doc = <PDFTemplate data={data} />;
    const blob = await pdf(doc).toBlob();
    return blob;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
};

/**
 * Télécharge le PDF généré
 */
export const downloadPDF = async (data: PDFData, filename: string = 'estimation-fataplus.pdf') => {
  try {
    const blob = await generatePriceEstimatePDF(data);

    // Créer un lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
};

/**
 * Ouvre le PDF dans un nouvel onglet (aperçu)
 */
export const previewPDF = async (data: PDFData) => {
  try {
    const blob = await generatePriceEstimatePDF(data);
    const url = URL.createObjectURL(blob);

    // Ouvrir dans un nouvel onglet
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'aperçu. Vérifiez que les popups sont autorisés.');
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'aperçu du PDF:', error);
    throw error;
  }
};
