const Tesseract = require('tesseract.js');

/**
 * ocrService - Extracts text from a local file path
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function extractText(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      { 
        logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`) 
      }
    );
    return text;
  } catch (error) {
    console.error('[OCR Error]', error);
    throw new Error('Failed to extract text from image');
  }
}

module.exports = { extractText };
