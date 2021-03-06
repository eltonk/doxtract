'use strict';

const AdmZip = require('adm-zip');
const { extname } = require('path');

const extensionRegex = new RegExp('^(.docx|.xlsx|.pptx)$');
const paragraphRegex = new RegExp('(<w:t>|<w:t xml:space="preserve">)[^]*?(?=<\/w:p>)', 'g');
const textBlockRegex = new RegExp('(<w:t>|<w:t xml:space="preserve">)([^<]+)', 'g');

function getXMLData(path, xmlFilename) {
  return new Promise((resolve, reject) => {
    if (!extensionRegex.test(extname(path))) {
      reject(new Error('The file must be either a .docx, .xlsx or .pptx'));
    }
    try {
      const zip = new AdmZip(path);
      zip.getEntry(`word/${xmlFilename}.xml`).getDataAsync(
        data => resolve(data.toString())
      );
    } catch(err) {
      reject(`${err} (${path})`);
    }
  });
}

/**
 * Extracts the text from your Office file.
 * 
 * @param {String} path Path to the file you want to extract the text from.
 * @param {String} [xmlFilename='document'] Optional argument used to specify
 * the XML component of the file from which to extract the text (default is: 'document').
 */
module.exports.extractText = (path, xmlFilename = 'document') => {
  return getXMLData(path, xmlFilename).then((xml) => {
    let paragraph, textBlock, text = '';
    while (paragraph = paragraphRegex.exec(xml)) {
      while (textBlock = textBlockRegex.exec(paragraph[0])) {
        text += textBlock[2];
      }
      text += '\n\n';
    }
    return text;
  });
}
