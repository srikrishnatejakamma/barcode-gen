const express = require('express');
const bwipjs = require('bwip-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Barcode = require('../models/Barcode');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// NOTE: Removed the hard-coded SUPPORTED list to allow any bwip-js "bcid".
// The bwip-js library will return an error at runtime for unsupported bcids.
// This keeps the API future-proof and avoids needing to maintain a long list.

/**
 * GET /api/barcodes/supported
 * Informational endpoint: we no longer enforce a curated list server-side.
 * Consumers should consult bwip-js docs for the definitive list of supported bcids:
 *   https://github.com/metafloor/bwip-js/tree/master/docs
 */
router.get('/supported', (req, res) => {
  res.json({
    note: 'This API accepts any bwip-js "bcid". Unsupported types will produce an error when generating.',
    docs: 'https://github.com/metafloor/bwip-js/tree/master/docs',
    example: 'POST /api/barcodes/generate { "format": "qrcode", "text": "hello" }'
  });
});

// POST /api/barcodes/generate
// body: { format, text, options, save, createdBy }
router.post('/generate', async (req, res) => {
  try {
    const { format, text, options = {}, save = false, createdBy } = req.body;
    if (!format || !text) return res.status(400).json({ error: 'format and text are required' });

    // Accept any bcid (barcode identifier) and let bwip-js validate/throw if unsupported.
    const bcid = String(format).toLowerCase();

    const bwipOpts = {
      bcid,
      text: String(text),
      scale: options.scale || 3,
      height: options.height || 10,
      includetext: options.includetext !== undefined ? options.includetext : true,
      textxalign: options.textxalign || 'center',
      paddingwidth: options.paddingwidth || 10,
      paddingheight: options.paddingheight || 10,
      backgroundcolor: options.backgroundcolor || 'FFFFFF',
      ...options.bwipjs
    };

    bwipjs.toBuffer(bwipOpts, async (err, png) => {
      if (err) {
        // Return bwip-js error details to help callers correct the bcid/options.
        console.error('bwip-js error:', err);
        return res.status(400).json({
          error: 'Failed to generate barcode',
          detail: err.message || err.toString()
        });
      }

      const mimeType = 'image/png';

      if (save) {
        const fileName = `${uuidv4()}.png`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, png);

        const doc = new Barcode({
          format,
          text,
          options,
          mimeType,
          filePath: `/uploads/${fileName}`,
          createdBy
        });
        await doc.save();

        return res.json({
          id: doc._id,
          format: doc.format,
          text: doc.text,
          url: doc.filePath
        });
      } else {
        const base64 = png.toString('base64');
        return res.json({
          format,
          text,
          mimeType,
          image: `data:${mimeType};base64,${base64}`
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Barcode.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/image', async (req, res) => {
  try {
    const doc = await Barcode.findById(req.params.id).lean();
    if (!doc || !doc.filePath) return res.status(404).json({ error: 'Image not found' });

    const filePath = path.join(process.cwd(), doc.filePath.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });

    res.type(doc.mimeType || 'image/png');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;