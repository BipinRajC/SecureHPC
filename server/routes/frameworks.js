const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Framework = require('../models/Framework');

// Get all frameworks
router.get('/', async (req, res) => {
  try {
    const frameworks = await Framework.find();
    res.json(frameworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new framework
router.post('/', [
  body('name').notEmpty().trim(),
  body('version').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('controls').isArray(),
  body('supportedTools').isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const framework = new Framework({
      name: req.body.name,
      version: req.body.version,
      description: req.body.description,
      controls: req.body.controls,
      supportedTools: req.body.supportedTools,
      status: 'not-assessed',
      compliantCount: 0,
      totalControls: req.body.controls.length,
    });

    const newFramework = await framework.save();
    res.status(201).json(newFramework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific framework
router.get('/:id', async (req, res) => {
  try {
    const framework = await Framework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({ message: 'Framework not found' });
    }
    res.json(framework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a framework
router.patch('/:id', async (req, res) => {
  try {
    const framework = await Framework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({ message: 'Framework not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        framework[key] = req.body[key];
      }
    });

    const updatedFramework = await framework.save();
    res.json(updatedFramework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a framework
router.delete('/:id', async (req, res) => {
  try {
    const framework = await Framework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({ message: 'Framework not found' });
    }

    await framework.remove();
    res.json({ message: 'Framework deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 