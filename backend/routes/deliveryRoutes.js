const express = require('express');
const router = express.Router();
const { Delivery, DeliveryProof, Sale, Customer } = require('../models');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.findAll({
      where: { companyId: req.user.companyId },
      include: [
        { model: Sale, include: [Customer] },
        { model: DeliveryProof, as: 'proofs' }
      ]
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/proof', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ where: { id: req.params.id, companyId: req.user.companyId } });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    const proof = await DeliveryProof.create({
      deliveryId: delivery.id,
      signatureUrl: req.body.signatureUrl,
      photoUrl: req.body.photoUrl,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    });

    delivery.status = 'DELIVERED';
    delivery.deliveryDate = new Date();
    await delivery.save();

    res.status(201).json(proof);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
